import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {
  completeFileType,
  fileProgressType,
  onFileProgressType,
  parsedMessageDataType
} from "@/utils/p2p-library/types.ts";
import {isObjectMessage} from "@/utils/p2p-library/isObjectHelper.ts";
import {getShort} from "@/utils/p2p-library/shortId.ts";

interface FileMetadataMessage {
  type: "file-metadata";
  data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    chunks: number
  };
}

export class FileTransferMiddleware extends Middleware {
  private state: "idle" | "receiving" = "idle";
  private received: {
    chunks: ArrayBuffer[],
    percent: number,
    timestamp: number,
  } = {chunks: [], percent: 0, timestamp: 0};
  private fileMetadata: FileMetadataMessage["data"] | null = null;
  private chunkSize = 16 * 1024; // 16 KB chunks
  public onFileComplete?: (data: completeFileType) => void
  public onFileProgress?: (data: fileProgressType) => void

  init() {
  }

  call(data: parsedMessageDataType): boolean {
    if (isObjectMessage(data)) {
      if (data.type === "file-metadata") {
        this.handleFileMetadata(data as FileMetadataMessage);
      } else {
        return true
      }
    } else if (data instanceof ArrayBuffer || data instanceof Blob) {
      this.handleFileChunk(data);
    }
    return false;
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

  addChunk(buffer: ArrayBuffer) {
    if (!this.fileMetadata) return;

    this.received.chunks.push(buffer)

    const percent = Math.round(this.received.chunks.length / this.fileMetadata.chunks * 100)
    if (percent > this.received.percent) {

      // TODO: Try to create more general function for display progress
      this.onFileProgress?.({
        title: `Receiving from ${getShort(this.conn.targetPeerId)} ${this.received.chunks.length}/${this.fileMetadata.chunks}`,
        progress: percent,
        bitrate: Math.round(this.received.chunks.length * this.chunkSize / 1024 / 8 / (((new Date()).getTime() - this.received.timestamp) / 1000))
      })
      this.received.percent = percent;
    }
  }

  private handleFileChunk(chunk: ArrayBuffer | Blob) {
    if (this.state !== "receiving" || !this.fileMetadata) return;

    if (chunk instanceof Blob) {
      chunk.arrayBuffer().then((buffer) => this.addChunk(buffer));
    } else {
      this.addChunk(chunk);
    }

    // Check if file is complete
    if (this.received.chunks.length === this.fileMetadata.chunks) {
      this.assembleFile();
    }
  }

  private assembleFile() {
    if (!this.fileMetadata) return;
    const blob = new Blob(this.received.chunks, {type: this.fileMetadata.fileType});
    const url = URL.createObjectURL(blob);
    this.onFileComplete?.({peerId: this.conn.targetPeerId, data: {...this.fileMetadata, url}})
    this.state = 'idle'
    this.logger.info(`File ${this.fileMetadata.fileName} received`);
  }

  splitToChunks(file: File): Promise<ArrayBuffer[]> {
    return new Promise((resolve, reject) => {
      let previousPercent = 0
      const timestamp = (new Date()).getTime();
      this.onFileProgress?.({title: 'Chunking', progress: 0, bitrate: 0})

      let offset = 0;
      const chunks: ArrayBuffer[] = [];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          chunks.push(e.target.result);
          offset += e.target.result.byteLength;

          const percent = Math.round(offset / file.size * 100)
          if (percent > previousPercent) {
            this.onFileProgress?.({
              title: 'Chunking',
              progress: percent,
              bitrate: Math.round(offset / 1024 / 8 / (((new Date()).getTime() - timestamp) / 1000))
            });
            previousPercent = percent;
          }

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

  // TODO: Remove this function (inefficient for large files) create chunks while sending
  async sendFile(file: File) {
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
    this.send(metadata);

    const chunks = await this.splitToChunks(file)

    let previousPercent = 0
    const timestamp = (new Date()).getTime();
    this.onFileProgress?.({title: 'Sending', progress: 0, bitrate: 0})

    await this.conn.sendLargeData(chunks, (chunkIdx) => {
      const percent = Math.round((chunkIdx + 1) / chunks.length * 100)
      if (percent > previousPercent) {
        this.onFileProgress?.({
          title: `Sending ${chunkIdx + 1}/${chunks.length}`,
          progress: percent,
          bitrate: Math.round(chunkIdx * this.chunkSize / 1024 / 8 / (((new Date()).getTime() - timestamp) / 1000))
        })
        previousPercent = percent;
      }
    })

    this.logger.info("File transfer completed!")
  }
}
