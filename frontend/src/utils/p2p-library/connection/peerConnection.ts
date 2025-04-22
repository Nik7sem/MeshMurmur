import {ChannelEventHandlers,} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/logger.ts";
import {parseRTCStats} from "@/utils/p2p-library/parseRTCStart.ts";
import {WebRTCPeerConnection} from "@/utils/p2p-library/connection/webRTCPeerConnection.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {ManagerMiddleware} from "@/utils/p2p-library/middlewares/managerMiddleware.ts";
import {SignatureMiddleware} from "@/utils/p2p-library/middlewares/signatureMiddleware.ts";
import {FileTransferMiddleware} from "@/utils/p2p-library/middlewares/fileTransferMiddleware.ts";
import {TextMiddleware} from "@/utils/p2p-library/middlewares/textMiddleware.ts";
import {TypingEventMiddleware} from "@/utils/p2p-library/middlewares/typingEventMiddleware.ts";
import {NicknameMiddleware} from "@/utils/p2p-library/middlewares/nicknameMiddleware.ts";
import {DiscoveryMiddleware} from "@/utils/p2p-library/middlewares/discoveryMiddleware.ts";
import {DisconnectEventMiddleware} from "@/utils/p2p-library/middlewares/disconnectEventMiddleware.ts";

export class PeerConnection {
  private connection: WebRTCPeerConnection
  public managerMiddleware: ManagerMiddleware
  public connected = false;
  public connectionType = "";

  constructor(
    public readonly peerId: string,
    public readonly targetPeerId: string,
    private logger: Logger,
    private signaler: Signaler,
    private onPeerConnectionChanged: (status: 'connected' | 'disconnected', block: boolean) => void,
    private timeout = 30000
  ) {
    this.managerMiddleware = new ManagerMiddleware(this, this.logger)
    this.managerMiddleware.add(SignatureMiddleware, 1)
    this.managerMiddleware.add(FileTransferMiddleware, 2)
    this.managerMiddleware.add(TextMiddleware, 3)
    this.managerMiddleware.add(TypingEventMiddleware, 4)
    this.managerMiddleware.add(NicknameMiddleware, 5)
    this.managerMiddleware.add(DiscoveryMiddleware, 6)
    this.managerMiddleware.add(DisconnectEventMiddleware, 7)
    this.connection = this.connect()
  }

  private connect(): WebRTCPeerConnection {
    setTimeout(() => {
      if (!this.connected) {
        this.onFinalState("timeout")
      }
    }, this.timeout)

    return new WebRTCPeerConnection(this.peerId, this.targetPeerId, this.signaler, this.logger, this.onFinalState, this.onData, this.onChannelOpen)
  }

  private onData: ChannelEventHandlers['ondata'] = (data) => {
    if (!this.managerMiddleware.call(data)) return
    this.logger.warn("Not handled data:", data)
  }

  private onChannelOpen: ChannelEventHandlers['onopen'] = async (data) => {
    this.logger.info(`${data.channelType} data channel opened!`)
    await this.managerMiddleware.init(data)
  }

  private onFinalState = async (state: RTCPeerConnectionState | "timeout") => {
    this.signaler.cleanup(this.targetPeerId)
    if (state === "connected") {
      this.connected = true
      const stats = await this.connection.getStats()
      const {info} = parseRTCStats(stats)
      if (info) {
        this.logger.info(`Candidates info: `, info);
        // this.logger.success(`Connection is using ${info.type} server.`);
        this.connectionType = info.type
      }
      this.onPeerConnectionChanged('connected', false);
      // this.logger.success("Successfully connected to peer!")
    } else {
      this.disconnect()
      this.logger.error(`Error in connection to peer: ${state}!`)
    }
  }

  get channel() {
    return this.connection.channel
  }

  disconnect(block = false) {
    this.connection.cleanup()
    this.onPeerConnectionChanged("disconnected", block)
  }
}