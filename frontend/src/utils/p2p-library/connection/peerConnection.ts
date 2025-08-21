import {ChannelEventHandlers, connectionStageType,} from "@/utils/p2p-library/types.ts";
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
import {AppConfig} from "@/utils/p2p-library/conf.ts";
import {PingMiddleware} from "@/utils/p2p-library/middlewares/pingMiddleware.ts";

export class PeerConnection {
  private connection: WebRTCPeerConnection
  private connectTimeoutId: NodeJS.Timeout | null = null;
  public managerMiddleware: ManagerMiddleware
  public connectionStage: connectionStageType = "connecting";
  public connectionType = "";

  constructor(
    public readonly peerId: string,
    public readonly targetPeerId: string,
    private logger: Logger,
    private signaler: Signaler,
    private onPeerConnectionChanged: (status: connectionStageType, block: boolean) => void,
  ) {
    this.managerMiddleware = new ManagerMiddleware(this, this.logger)
    this.managerMiddleware.add(SignatureMiddleware, 1)
    this.managerMiddleware.add(FileTransferMiddleware, 2)
    this.managerMiddleware.add(TextMiddleware, 3)
    this.managerMiddleware.add(TypingEventMiddleware, 4)
    this.managerMiddleware.add(NicknameMiddleware, 5)
    this.managerMiddleware.add(DisconnectEventMiddleware, 6)
    this.managerMiddleware.add(DiscoveryMiddleware, 7)
    this.managerMiddleware.add(PingMiddleware, 8)
    this.connection = this.connect()
  }

  public is_connected() {
    return this.connectionStage === "connected"
  }

  private connect(): WebRTCPeerConnection {
    this.connectTimeoutId = setTimeout(() => {
      if (!this.is_connected()) {
        this.onFinalState("timeout")
      }
    }, AppConfig.connectingTimeout)

    return new WebRTCPeerConnection(this.peerId, this.targetPeerId, this.signaler, this.logger, this.onFinalState, this.onData, this.onChannelOpen)
  }

  private onData: ChannelEventHandlers['ondata'] = (data) => {
    if (!this.managerMiddleware.call(data)) return
    this.logger.warn("Not handled data:", data)
  }

  private onChannelOpen: ChannelEventHandlers['onopen'] = async (data) => {
    await this.managerMiddleware.init(data)
  }

  private onFinalState = async (state: RTCPeerConnectionState | "timeout") => {
    this.signaler.cleanup(this.targetPeerId)
    if (state === "connected") {
      this.connectionStage = "connected"
      if (this.connectTimeoutId) clearTimeout(this.connectTimeoutId)
      const stats = await this.connection.getStats()
      const {info} = parseRTCStats(stats)
      if (info) {
        this.logger.info(`Candidates info: `, info);
        this.logger.info(`Connection is using ${info.type} server.`);
        this.connectionType = info.type
      }
      this.onPeerConnectionChanged('connected', false);
      this.logger.info(`Connected to ${this.targetPeerId}`)
    } else {
      this.disconnect(false, true)
      this.logger.error(`Error in connection to peer: ${state}!`)
    }
  }

  get channel() {
    return this.connection.channel
  }

  async disconnect(block = false, force = false): Promise<boolean> {
    if (!block && !force && this.connectionStage === "connected") {
      this.connectionStage = "pinging"
      if (await this.managerMiddleware.get(PingMiddleware)?.sendPing()) {
        this.connectionStage = "connected"
        this.logger.info(`Still connected to ${this.targetPeerId}`)
        return false
      }
    }
    if (this.connectTimeoutId) clearTimeout(this.connectTimeoutId)
    this.connection.cleanup()
    this.connectionStage = "disconnected"
    this.onPeerConnectionChanged("disconnected", block)
    return true
  }
}