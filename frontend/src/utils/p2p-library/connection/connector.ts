import {Logger} from '../../logger.ts'
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {AppConfig} from "@/utils/p2p-library/conf.ts";
import {ActionManager} from "@/utils/p2p-library/connection/actionManager.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {createSignaler} from "@/utils/p2p-library/signalers/createSignaler.ts";
import {connectionStageType, signalerNameType} from "@/utils/p2p-library/types.ts";
import {PingMiddleware} from "@/utils/p2p-library/middlewares/pingMiddleware.ts";

export interface ConnectorConfig {
  signaler: signalerNameType
  autoconnect: boolean
  autoreconnect: boolean
}

export class Connector {
  private readonly signaler: Signaler;
  public connections: { [peerId: string]: PeerConnection } = {}
  public actions: ActionManager
  public onPeerConnectionChanged?: (targetPeerId: string, status: connectionStageType) => void
  public blackList: Set<string> = new Set()
  public potentialPeers: Set<string> = new Set()

  constructor(
    public peerId: string,
    private __config: ConnectorConfig,
    private logger: Logger,
  ) {
    this.actions = new ActionManager(this, logger);
    this.signaler = createSignaler(this.config.signaler, this.peerId, this.logger);
  }

  async init() {
    const disconnect = async (removedPeerId: string) => {
      if (removedPeerId in this.connections) {
        const pc = this.connections[removedPeerId]
        if (await pc.ping()) {
          this.logger.info(`Still connected to ${removedPeerId}`)
        } else {
          const connectionState = pc.connectionStage
          const nickname = this.actions.targetPeerNickname(removedPeerId)
          pc.disconnect()
          if (connectionState === 'reconnecting') {
            this.logger.warn(`Reconnecting after reload to ${nickname}...`)
            this.createConnection(removedPeerId)
          } else {
            this.logger.warn(`${nickname} disconnected by exit`);
          }
        }
      }
      this.potentialPeers.delete(removedPeerId);
    }

    this.signaler.onInvite = (targetPeerId) => this.createConnection(targetPeerId, false);
    this.signaler.onAddedPeer = (targetPeerId) => this.createConnection(targetPeerId)
    this.signaler.onRemovedPeer = disconnect
    this.signaler.onPeerList = (peerIds) => {
      const peersSet = new Set(peerIds)
      for (const peerId of this.potentialPeers) {
        if (!peersSet.has(peerId)) {
          disconnect(peerId);
        }
      }
      for (const peerId of peersSet) {
        if (!this.potentialPeers.has(peerId)) {
          this.createConnection(peerId);
        }
      }
    }

    this.signaler.registerPeer({ready: this.config.autoconnect});
    this.logger.info(`Registered peer [${this.signaler.info()}]:`, this.peerId);
  }

  get config() {
    return this.__config
  }

  public updateConfig(newConfig: ConnectorConfig) {
    if (newConfig.signaler !== this.__config.signaler) return // not be able to change signaler while running
    this.__config = newConfig;
    this.signaler.setPeerData({ready: this.config.autoconnect});
  }

  public async createConnection(targetPeerId: string, outgoing = true, manual = false) {
    if (targetPeerId === this.peerId) return

    this.potentialPeers.add(targetPeerId);

    if (targetPeerId in this.connections) {
      if (!outgoing && this.connections[targetPeerId].connectionStage === 'pinging') {
        this.connections[targetPeerId].connectionStage = 'reconnecting'
        this.connections[targetPeerId].managerMiddleware.get(PingMiddleware)?.resolvePing(false)
      }
      return
    }

    if (!manual) {
      if (this.blackList.has(targetPeerId)) return
      if (!this.config.autoconnect) return
      if (this.peers.length >= AppConfig.maxNumberOfPeers) return
      if (outgoing && this.peers.length >= AppConfig.maxNumberOfOutgoingConnections) return
    }

    if (outgoing) {
      this.signaler.sendInvite(targetPeerId)
    }

    this.connections[targetPeerId] = new PeerConnection(this.peerId, targetPeerId, this.logger, this.signaler, this.createOnPeerConnectionChanged(targetPeerId));
    this.actions.registerCallbacksAndData(targetPeerId)
    this.onPeerConnectionChanged?.(targetPeerId, 'connecting')
  }

  private createOnPeerConnectionChanged(targetPeerId: string) {
    return (status: connectionStageType, block: boolean, webrtcError: boolean) => {
      if (status === "disconnected") {
        delete this.connections[targetPeerId]
        if (block) {
          this.blackList.add(targetPeerId)
        } else {
          if (webrtcError && this.config.autoreconnect) {
            this.logger.warn(`Reconnecting after error to ${this.actions.targetPeerNickname(targetPeerId)}`)
            this.createConnection(targetPeerId)
          }
        }
      } else if (status === "connected") {
        this.logger.success(`Connected to ${this.actions.targetPeerNickname(targetPeerId)}`);
      }
      this.onPeerConnectionChanged?.(targetPeerId, status)
    }
  }

  get peers() {
    return Object.values(this.connections)
  }

  get connectedPeers() {
    return this.peers.filter((conn) => conn.is_connected())
  }

  cleanup() {
  }
}