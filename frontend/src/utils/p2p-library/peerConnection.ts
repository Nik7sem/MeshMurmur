import {messageDataType, messagePeerDataType, rawMessageDataType} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/logger.ts";
import {parseRTCStats} from "@/utils/p2p-library/parseRTCStart.ts";
import {WebRTCPeerConnection} from "@/utils/p2p-library/webRTCPeerConnection.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {ManagerMiddleware} from "@/utils/p2p-library/middlewares/managerMiddleware.ts";
import {SignatureMiddleware} from "@/utils/p2p-library/middlewares/signatureMiddleware.ts";

export class PeerConnection {
  private onData?: (data: messagePeerDataType) => void
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
    this.managerMiddleware.add(SignatureMiddleware)
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
    return (event: MessageEvent<rawMessageDataType>) => {
      if (typeof event.data === "string") {
        const data = JSON.parse(event.data) as messageDataType;
        if (this.managerMiddleware.call(data)) {
          this.onData?.({data, peerId: this.targetPeerId})
        }
      } else {
        this.logger.warn("Not handled data: ", typeof event.data)
      }
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

  send(data: messageDataType, ignoreBlocked = false) {
    if (this.isBlocked() && !ignoreBlocked) return this.logger.warn(`Cannot send message to ${this.targetPeerId}, peer is not verified!`);
    this.connection.send(JSON.stringify(data))
  }

  setOnData(onData: (data: messagePeerDataType) => void) {
    this.onData = onData
  }

  isBlocked() {
    return this.managerMiddleware.isBlocked()
  }

  disconnect(block = false) {
    this.connection.cleanup()
    this.onClose(block)
  }
}