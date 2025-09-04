import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {processedFileType, eventDataType, fileProgressType,} from "@/utils/p2p-library/types.ts";
import {getShort} from "@/utils/p2p-library/helpers.ts";
import {FILE_CHUCK_WHOLE_SIZE, FILE_CHUNK_DATA_SIZE} from "@/utils/p2p-library/connection/DataChannel.ts";

interface FileMetadataMessage {
  type: "file-metadata";
  data: {
    fileName: string;
    fileSize: number;
    fileType: string;
    fileId: string
    chunks: number
  };
}

interface ChunkData {
  data: ArrayBuffer;
  metadata: {
    fileId: string
    chunkId: number
  }
}

export class FileTransferMiddleware extends Middleware {
  static name = "FileTransferMiddleware"
  private files = new Map<string, {
    received: {
      chunks: ChunkData[],
      percent: number,
      timestamp: number,
    }
    fileMetadata: FileMetadataMessage["data"]
  }>()
  private pendingFiles: Array<{
    file: File,
    metadata: FileMetadataMessage,
    resolve: () => void,
    reject: (error: unknown) => void
  }> = [];
  public onFileComplete?: (data: processedFileType) => void
  public onFileProgress?: (data: fileProgressType) => void

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
    if (this.files.has(message.data.fileId)) return;
    this.files.set(message.data.fileId, {
      fileMetadata: message.data,
      received: {chunks: [], percent: 0, timestamp: (new Date()).getTime()}
    })
    this.logger.info('Receiving file: ', message.data);
  }

  private showProgress(previousPercent: number, chunkIdx: number, chunksLen: number, timestamp: number, sending: boolean, chunking = false): number {
    const percent = Math.round(chunkIdx / chunksLen * 100)
    if (percent > previousPercent) {
      this.onFileProgress?.({
        title: `${sending ? 'Sending to' : 'Receiving from'} ${getShort(this.targetPeerId)} ${chunkIdx}/${chunksLen} ${chunking ? '(Chunking)' : ''}`,
        progress: percent,
        bitrate: Math.round(chunkIdx * FILE_CHUCK_WHOLE_SIZE / (((new Date()).getTime() - timestamp) / 1000))
      })
    }
    return percent
  }

  private handleFileChunk(chunk: ChunkData) {
    const file = this.files.get(chunk.metadata.fileId)
    if (!file) return

    file.received.chunks.push(chunk)
    file.received.percent = this.showProgress(file.received.percent, file.received.chunks.length, file.fileMetadata.chunks, file.received.timestamp, false)

    // Check if file is complete
    if (file.received.chunks.length === file.fileMetadata.chunks) {
      this.assembleFile(chunk.metadata.fileId);
    }
  }

  private assembleFile(fileId: string) {
    const file = this.files.get(fileId)
    if (!file) return

    file.received.chunks.sort((lhs, rhs) => lhs.metadata.chunkId - rhs.metadata.chunkId)
    const blob = new Blob(file.received.chunks.map((data) => data.data), {type: file.fileMetadata.fileType});
    const url = URL.createObjectURL(blob);
    this.onFileComplete?.({data: {...file.fileMetadata, url}})

    this.files.delete(fileId)
    this.logger.info(`File ${file.fileMetadata.fileName} received`);
  }

  private __createMetadata(file: File): FileMetadataMessage {
    return {
      type: "file-metadata",
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileId: window.crypto.randomUUID(),
        chunks: Math.ceil(file.size / FILE_CHUNK_DATA_SIZE),
      }
    }
  }

  private __sendFile(file: File, metadata: FileMetadataMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info('Sending file: ', metadata)
      this.channel.reliable.send(metadata)

      let previousPercent = 0
      let chunkIdx = 0
      let offset = 0;
      const timestamp = (new Date()).getTime()
      const reader = new FileReader()

      this.onFileProgress?.({title: 'Sending', progress: 0, bitrate: 0})

      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          offset += e.target.result.byteLength;

          if (chunkIdx < metadata.data.chunks) {
            this.channel.unordered.send({
              data: e.target.result,
              metadata: {chunkId: chunkIdx, fileId: metadata.data.fileId}
            } as ChunkData)
            ++chunkIdx
            previousPercent = this.showProgress(previousPercent, chunkIdx, metadata.data.chunks, timestamp, true)
            if (this.channel.unordered.channel.bufferedAmount <= this.channel.unordered.channel.bufferedAmountLowThreshold) {
              readNextChunk()
            }
          } else {
            this.channel.unordered.channel.onbufferedamountlow = null
            resolve()
          }
        }
      }

      reader.onerror = (error) => {
        this.channel.unordered.channel.onbufferedamountlow = null
        reject(error)
      }

      const readNextChunk = () => {
        const slice = file.slice(offset, offset + FILE_CHUNK_DATA_SIZE)
        reader.readAsArrayBuffer(slice)
      }

      this.channel.unordered.channel.onbufferedamountlow = () => readNextChunk()
      readNextChunk()
    })
  }

  private async processFileQueue() {
    if (this.pendingFiles.length === 0) return;

    const {file, metadata, resolve, reject} = this.pendingFiles[0];

    try {
      await this.__sendFile(file, metadata)
      this.logger.info("File transfer completed: ", metadata)
      resolve()
    } catch (error) {
      reject(error)
    } finally {
      this.pendingFiles.shift()
      this.processFileQueue()
    }
  }

  public async sendFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const metadata = this.__createMetadata(file)
      this.pendingFiles.push({file, metadata, resolve, reject})

      if (this.pendingFiles.length === 1) {
        this.processFileQueue()
      }
    })
  }
}
