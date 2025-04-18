import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {
  ChannelEventBase,
  processedFileType, eventDataType,
  fileProgressType,
} from "@/utils/p2p-library/types.ts";

import {getShort} from "@/utils/p2p-library/helpers.ts";

interface FileMetadataMessage {
  type: "file-metadata";
  data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    chunks: number
  };
}

interface ChunkData {
  data: ArrayBuffer;
  metadata: {
    chunkId: number;
  }
}

export class FileTransferMiddleware extends Middleware {
  private chunkSize = 0
  private state: "idle" | "receiving" = "idle";
  private received: {
    chunks: ChunkData[],
    percent: number,
    timestamp: number,
  } = {chunks: [], percent: 0, timestamp: 0};
  private fileMetadata: FileMetadataMessage["data"] | null = null;
  public onFileComplete?: (data: processedFileType) => void
  public onFileProgress?: (data: fileProgressType) => void

  async init(eventData: ChannelEventBase) {
    if (eventData.channelType === "reliable") {
      this.chunkSize = this.conn.channel.unordered.CHUNK_SIZE - this.conn.channel.unordered.METADATA_SIZE
    }
  }

  call(eventData: eventDataType): boolean {
    if (eventData.datatype === 'json' && eventData.channelType === "reliable") {
      if (eventData.type === "file-metadata") {
        this.handleFileMetadata(eventData as FileMetadataMessage);
        return false;
      }
    } else if (eventData.datatype === 'byte' && eventData.channelType === "unordered") {
      this.handleFileChunk(eventData as ChunkData);
      return false;
    }
    return true;
  }

  private handleFileMetadata(message: FileMetadataMessage) {
    if (this.state !== "idle") return;
    this.fileMetadata = message.data;
    this.received = {chunks: [], percent: 0, timestamp: (new Date()).getTime()};
    this.onFileProgress?.({
      title: `Receiving from ${getShort(this.conn.targetPeerId)} (Chunking)`,
      progress: 0,
      bitrate: 0
    })
    this.state = "receiving";
    this.logger.info(`Receiving file: ${message.data.fileName}`);
  }

  private showProgress(previousPercent: number, chunkIdx: number, chunksLen: number, timestamp: number, sending: boolean, chunking = false): number {
    const percent = Math.round(chunkIdx / chunksLen * 100)
    if (percent > previousPercent) {
      this.onFileProgress?.({
        title: `${sending ? 'Sending to' : 'Receiving from'} ${getShort(this.conn.targetPeerId)} ${chunkIdx}/${chunksLen} ${chunking ? '(Chunking)' : ''}`,
        progress: percent,
        bitrate: Math.round(chunkIdx * this.chunkSize / 1024 / 8 / (((new Date()).getTime() - timestamp) / 1000))
      })
    }
    return percent
  }

  private addChunk(chunk: ChunkData) {
    if (!this.fileMetadata) return;

    this.received.chunks.push(chunk)
    this.received.percent = this.showProgress(this.received.percent, this.received.chunks.length, this.fileMetadata.chunks, this.received.timestamp, false)
  }

  private handleFileChunk(chunk: ChunkData) {
    if (this.state !== "receiving" || !this.fileMetadata) return;
    this.addChunk(chunk);

    // Check if file is complete
    if (this.received.chunks.length === this.fileMetadata.chunks) {
      this.assembleFile();
    }
  }

  private assembleFile() {
    if (!this.fileMetadata) return;
    this.received.chunks.sort((lhs, rhs) => lhs.metadata.chunkId - rhs.metadata.chunkId)
    const blob = new Blob(this.received.chunks.map((data) => data.data), {type: this.fileMetadata.fileType});
    const url = URL.createObjectURL(blob);
    this.onFileComplete?.({data: {...this.fileMetadata, url}})
    this.state = 'idle'
    this.logger.info(`File ${this.fileMetadata.fileName} received`);
  }

  // TODO: Remove this function (inefficient for large files) create chunks while sending
  private splitToChunks(file: File): Promise<ArrayBuffer[]> {
    return new Promise((resolve, reject) => {
      let previousPercent = 0
      const timestamp = (new Date()).getTime();
      this.onFileProgress?.({title: 'Chunking', progress: 0, bitrate: 0})

      let offset = 0;
      const chunks: ArrayBuffer[] = [];
      const chunksLen = Math.ceil(file.size / this.chunkSize);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          chunks.push(e.target.result);
          offset += e.target.result.byteLength;

          previousPercent = this.showProgress(previousPercent, chunks.length, chunksLen, timestamp, true, true)

          if (offset < file.size) {
            readNextChunk();
          } else {
            resolve(chunks);
          }
        }
      };

      const readNextChunk = () => {
        const slice = file.slice(offset, offset + this.chunkSize);
        reader.readAsArrayBuffer(slice);
      };

      readNextChunk();
    })
  }

  private sendLargeData(chunks: ArrayBuffer[]): Promise<void> {
    return new Promise((resolve, reject) => {
      let chunkIdx = 0
      let previousPercent = 0
      const timestamp = (new Date()).getTime();
      this.onFileProgress?.({title: 'Sending', progress: 0, bitrate: 0})

      this.conn.channel.unordered.channel.onbufferedamountlow = () => sendNextChunk()

      const sendNextChunk = () => {
        if (chunkIdx < chunks.length) {
          this.conn.channel.unordered.send({data: chunks[chunkIdx], metadata: {chunkId: chunkIdx}} as ChunkData)
          ++chunkIdx
          previousPercent = this.showProgress(previousPercent, chunkIdx, chunks.length, timestamp, true)
          if (this.conn.channel.unordered.channel.bufferedAmount <= this.conn.channel.unordered.channel.bufferedAmountLowThreshold) {
            sendNextChunk()
          }
        } else {
          this.conn.channel.unordered.channel.onbufferedamountlow = null
          resolve()
        }
      }

      sendNextChunk()
    })
  }

  public async sendFile(file: File) {
    if (this.state !== "idle") return this.logger.warn("Cannot send file while receiving!");
    this.logger.info(`Sending file: ${file.name}, Size: ${file.size} bytes`);

    // Send metadata
    const metadata: FileMetadataMessage = {
      type: "file-metadata",
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunks: Math.ceil(file.size / this.chunkSize),
      }
    };
    this.conn.channel.reliable.send(metadata);

    await this.sendLargeData(await this.splitToChunks(file))
    this.logger.info("File transfer completed!")
  }
}
