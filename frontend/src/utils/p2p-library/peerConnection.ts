import {FirebaseSignaler} from "@/utils/p2p-library/signaling/firebase-signaler.ts";
import {ConnectionDataType, messageDataType} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/p2p-library/logger.ts";
import {parseRTCStats} from "@/utils/p2p-library/parseRTCStart.ts";
import {WebRTCPeerConnection} from "@/utils/p2p-library/webRTCPeerConnection.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";

export class PeerConnection {
  private onData: ({peerId, text}: messageDataType) => void
  private onMessage?: ({peerId, text}: messageDataType) => void
  private connection: WebRTCPeerConnection
  public info: ConnectionDataType['info']

  constructor(
    private peerId: string,
    private targetPeerId: string,
    private logger: Logger,
    private signaler: Signaler,
    private onClose: () => void,
    private timeout = 5000
  ) {
    this.onData = ({peerId, text}: messageDataType) => {
      this.onMessage?.({peerId, text})
    }

    this.info = {connected: false, type: "",}
    this.connection = this.connect()
  }

  private connect(): WebRTCPeerConnection {
    const onFinalState = this.createOnFinalState()

    setTimeout(() => {
      if (!this.info.connected) {
        onFinalState("timeout")
      }
    }, this.timeout)

    return new WebRTCPeerConnection(this.signaler, this.logger, this.targetPeerId, this.peerId > this.targetPeerId, this.onData, onFinalState)
  }

  createOnFinalState() {
    return async (state: RTCPeerConnectionState | "timeout") => {
      this.signaler.cleanup(this.targetPeerId)
      if (state === "connected") {
        this.info.connected = true
        const stats = await this.connection.getStats()
        const {info} = parseRTCStats(stats)
        if (info) {
          this.logger.info(`Candidates info: `, info);
          this.logger.success(`Connection is using ${info.type} server.`);
          this.info.type = info.type
        }
        this.logger.success("Successfully connected to peer!")
      } else {
        this.connection.cleanup()
        this.signaler.off(this.targetPeerId)
        this.onClose()
        this.logger.error(`Error in connection to peer: ${state}!`)
      }
    }
  }

  send(text: string) {
    this.connection.send(text)
  }

  setOnMessage(onMessage: ({peerId, text}: messageDataType) => void) {
    this.onMessage = onMessage
  }
}