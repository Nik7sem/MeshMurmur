import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {completeFileType, parsedMessageDataType} from "@/utils/p2p-library/types.ts";
import {isObjectMessage} from "@/utils/p2p-library/isObjectHelper.ts";

interface FileMetadataMessage {
  type: "file-metadata";
  data: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

export class FileTransferMiddleware extends Middleware {
  private state: "idle" | "receiving" = "idle";
  private receivedChunks: ArrayBuffer[] = [];
  private fileMetadata: FileMetadataMessage["data"] | null = null;
  private chunkSize = 16 * 1024; // 16 KB chunks
  public onFile?: (data: completeFileType) => void

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
    this.receivedChunks = [];
    this.state = "receiving";
    this.logger.info(`Receiving file: ${message.data.fileName}`);
  }

  private handleFileChunk(chunk: ArrayBuffer | Blob) {
    if (this.state !== "receiving") return;

    if (chunk instanceof Blob) {
      chunk.arrayBuffer().then((buffer) => this.receivedChunks.push(buffer));
    } else {
      this.receivedChunks.push(chunk);
    }

    // Check if file is complete
    const receivedSize = this.receivedChunks.reduce((sum, buf) => sum + buf.byteLength, 0);
    if (this.fileMetadata && receivedSize >= this.fileMetadata.fileSize) {
      this.assembleFile();
    }
  }

  private assembleFile() {
    if (!this.fileMetadata) return;
    const blob = new Blob(this.receivedChunks, {type: this.fileMetadata.fileType});
    const url = URL.createObjectURL(blob);
    this.onFile?.({peerId: this.conn.targetPeerId, data: {...this.fileMetadata, url}})
    this.state = 'idle'
    this.logger.info(`File ${this.fileMetadata.fileName} received`);
  }

  sendFile(file: File) {
    this.logger.info(`Sending file: ${file.name}, Size: ${file.size} bytes`);

    // Send metadata
    const metadata: FileMetadataMessage = {
      type: "file-metadata",
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    };
    this.send(metadata);

    // Read file in chunks
    let offset = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        this.send(e.target.result);
        offset += e.target.result.byteLength;

        if (offset < file.size) {
          readNextChunk();
        }
      }
    };

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + this.chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
    this.logger.info("File transfer completed!")
  }
}
