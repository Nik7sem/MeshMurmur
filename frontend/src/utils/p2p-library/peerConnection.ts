import {
  parsedMessageDataType,
  rawMessageDataType,
  completeMessageType, onFileProgressType,
} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/logger.ts";
import {parseRTCStats} from "@/utils/p2p-library/parseRTCStart.ts";
import {WebRTCPeerConnection} from "@/utils/p2p-library/webRTCPeerConnection.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {ManagerMiddleware} from "@/utils/p2p-library/middlewares/managerMiddleware.ts";
import {SignatureMiddleware} from "@/utils/p2p-library/middlewares/signatureMiddleware.ts";
import {isObjectMessage} from "@/utils/p2p-library/isObjectHelper.ts";
import {FileTransferMiddleware} from "@/utils/p2p-library/middlewares/fileTransferMiddleware.ts";
import {TextMiddleware} from "@/utils/p2p-library/middlewares/textMiddleware.ts";

export class PeerConnection {
  public onCompleteData?: (data: completeMessageType) => void
  public onFileProgress?: onFileProgressType
  private connection: WebRTCPeerConnection
  private managerMiddleware: ManagerMiddleware
  public connected = false;
  public connectionType = "";

  constructor(
    public readonly peerId: string,
    public readonly targetPeerId: string,
    private logger: Logger,
    private signaler: Signaler,
    private onClose: (block: boolean) => void,
    private timeout = 5000
  ) {
    this.managerMiddleware = new ManagerMiddleware((data) => this.send(data, true), this, this.logger)
    this.managerMiddleware.add(SignatureMiddleware, 3)
    const fileTransferMiddleware = this.managerMiddleware.add(FileTransferMiddleware, 2)
    fileTransferMiddleware.onFileComplete = (data) => this.onCompleteData?.(data)
    fileTransferMiddleware.onFileProgress = (data) => this.onFileProgress?.(data)
    this.managerMiddleware.add(TextMiddleware, 1).onText = (data) => this.onCompleteData?.(data)
    this.connection = this.connect()
  }

  private connect(): WebRTCPeerConnection {
    const onFinalState = this.createOnFinalState()
    const onData = this.createOnData()
    const onChannelOpen = this.createOnChannelOpen()

    setTimeout(() => {
      if (!this.connected) {
        onFinalState("timeout")
      }
    }, this.timeout)

    return new WebRTCPeerConnection(this.signaler, this.logger, this.targetPeerId, this.peerId > this.targetPeerId, onData, onFinalState, onChannelOpen)
  }

  private createOnData() {
    return (data: rawMessageDataType) => {
      const parsedData: parsedMessageDataType = typeof data === "string" ? JSON.parse(data) : data;
      if (!this.managerMiddleware.call(parsedData)) return
      this.logger.warn("Not handled data:", parsedData)
    }
  }

  private createOnChannelOpen() {
    return () => {
      this.logger.info("Data channel opened!")
      this.managerMiddleware.init()
    }
  }

  private createOnFinalState() {
    return async (state: RTCPeerConnectionState | "timeout") => {
      this.signaler.cleanup(this.targetPeerId)
      if (state === "connected") {
        this.connected = true
        const stats = await this.connection.getStats()
        const {info} = parseRTCStats(stats)
        if (info) {
          this.logger.info(`Candidates info: `, info);
          this.logger.success(`Connection is using ${info.type} server.`);
          this.connectionType = info.type
        }
        this.logger.success("Successfully connected to peer!")
      } else {
        this.disconnect()
        this.logger.error(`Error in connection to peer: ${state}!`)
      }
    }
  }

  send(data: parsedMessageDataType, ignoreBlocked = false) {
    if (this.isBlocked() && !ignoreBlocked) return this.logger.warn(`Cannot send message to ${this.targetPeerId}, peer is not verified!`);
    if (isObjectMessage(data)) {
      this.connection.send(JSON.stringify(data))
    } else {
      this.connection.send(data)
    }
  }

  async sendFile(file: File) {
    await this.managerMiddleware.get(FileTransferMiddleware)?.sendFile(file)
  }

  isBlocked() {
    return this.managerMiddleware.isBlocked()
  }

  disconnect(block = false) {
    this.connection.cleanup()
    this.onClose(block)
  }

  sendLargeData(chunks: ArrayBuffer[], onChunkIdx: (chunkIdx: number) => void) {
    return this.connection.sendLargeData(chunks, onChunkIdx)
  }
}