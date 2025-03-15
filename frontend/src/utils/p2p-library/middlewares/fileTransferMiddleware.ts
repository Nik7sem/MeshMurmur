import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";
import {isObjectMessage} from "@/utils/p2p-library/isObjectMessage.ts";

interface FileMetadataMessage {
  type: "file-metadata";
  data: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

interface FileTransferRequestMessage {
  type: "file-transfer-request";
  data: { fileName: string };
}

export class FileTransferMiddleware extends Middleware {
  private state: "idle" | "awaiting-transfer" | "receiving" | "completed" = "idle";
  private receivedChunks: ArrayBuffer[] = [];
  private fileMetadata: FileMetadataMessage["data"] | null = null;

  init() {
  }

  call(data: messageDataType): boolean {
    if (isObjectMessage(data)) {
      switch (data.type) {
        case "file-metadata":
          this.handleFileMetadata(data as FileMetadataMessage);
          break
        case "file-transfer-request":
          this.handleFileTransferRequest(data as FileTransferRequestMessage);
          break
        default:
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
    this.state = "awaiting-transfer";
    this.logger.info(`Receiving file: ${message.data.fileName}`);
  }

  private handleFileTransferRequest(message: FileTransferRequestMessage) {
    if (this.state !== "idle") return;
    this.logger.info(`File transfer request received for ${message.data.fileName}`);
    this.sendFile(message.data.fileName);
  }

  private handleFileChunk(chunk: ArrayBuffer | Blob) {
    if (this.state !== "awaiting-transfer") return;

    this.state = "receiving";
    if (chunk instanceof Blob) {
      chunk.arrayBuffer().then((buffer) => this.receivedChunks.push(buffer));
    } else {
      this.receivedChunks.push(chunk);
    }

    // Check if file is complete
    const receivedSize = this.receivedChunks.reduce((sum, buf) => sum + buf.byteLength, 0);
    if (this.fileMetadata && receivedSize >= this.fileMetadata.fileSize) {
      this.state = "completed";
      this.logger.info(`File ${this.fileMetadata.fileName} received completely`);
      this.assembleFile();
    }
  }

  private assembleFile() {
    if (!this.fileMetadata) return;
    const blob = new Blob(this.receivedChunks, {type: this.fileMetadata.fileType});
    this.logger.info(`Assembled file: ${this.fileMetadata.fileName}`);
    const url = URL.createObjectURL(blob);
    // Do something with the file, like creating a download link
  }

  sendFile(file: File) {
  this.logger.info(`Sending file: ${file.name}, Size: ${file.size} bytes`);

  // 1️⃣ Send metadata first
  const metadata: FileMetadataMessage = {
    type: "file-metadata",
    data: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }
  };
  this.send(metadata);

  // 2️⃣ Read file in chunks
  const chunkSize = 16 * 1024; // 16 KB chunks
  let offset = 0;
  const reader = new FileReader();

  reader.onload = (event) => {
    if (event.target?.result instanceof ArrayBuffer) {
      this.send(event.target.result);
      offset += chunkSize;

      if (offset < file.size) {
        readNextChunk();
      } else {
        this.logger.info("File transfer completed!");
      }
    }
  };

  const readNextChunk = () => {
    const slice = file.slice(offset, offset + chunkSize);
    reader.readAsArrayBuffer(slice);
  };

  readNextChunk();
}

  isBlocked(): boolean {
    return this.state === "receiving";
  }
}
