import {Logger} from '../../logger.ts'
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {ActionManager} from "@/utils/p2p-library/connection/actionManager.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {createSignaler} from "@/utils/p2p-library/signalers/createSignaler.ts";
import {connectionStageType, signalerNameType} from "@/utils/p2p-library/types.ts";
import {NegotiationManager, NegotiationPackageType} from "@/utils/p2p-library/connection/negotiationManager.ts";
import {AppConfig} from "@/utils/p2p-library/conf.ts";
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
          this.logger.info(`Still connected to ${removedPeerId}.`)
        } else {
          if (pc.connectionStage !== 'disconnected') {
            this.logger.warn(`${this.actions.targetPeerNickname(removedPeerId)} disconnected by exit.`);
            pc.disconnect()
          }
        }
      }
      this.potentialPeers.delete(removedPeerId);
    }

    this.signaler.onNegotiationPackage = (targetPeerId, np) => {
      if (targetPeerId in this.connections) {
        this.connections[targetPeerId].negotiationManager.onNegotiationPackage(np)
      } else {
        this.createConnection(targetPeerId, false, np)
      }
    };
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
    this.logger.info(`Registered peer [${this.signaler.info()}]: ${this.peerId}.`);
  }

  get config() {
    return this.__config
  }

  public updateConfig(newConfig: ConnectorConfig) {
    if (newConfig.signaler !== this.__config.signaler) return // not be able to change signaler while running
    this.__config = newConfig;
    this.signaler.setPeerData({ready: this.config.autoconnect});
  }

  public async createConnection(targetPeerId: string, manual = false, np?: NegotiationPackageType) {
    if (targetPeerId === this.peerId) return
    this.potentialPeers.add(targetPeerId);
    if (targetPeerId in this.connections) return

    const allowed = this.isPeerAllowedToConnect(targetPeerId, manual, !!np)
    if (!allowed) {
      if (np) {
        NegotiationManager.reject((_np) => this.signaler.sendNegotiationPackage(targetPeerId, _np))
        this.logger.info(`Incoming connection rejected ${targetPeerId}.`)
      } else {
        this.logger.info(`Outgoing connection rejected ${targetPeerId}.`)
      }
      return
    }

    this.connections[targetPeerId] = new PeerConnection(this.peerId, targetPeerId, this.logger, this.signaler, this.createOnPeerConnectionChanged(targetPeerId));
    this.connections[targetPeerId].negotiationManager.reconnect = (np) => {
      const nickname = this.actions.targetPeerNickname(targetPeerId)
      const pc = this.connections[targetPeerId]
      const connectionStage = pc.connectionStage
      pc.disconnect()

      if (connectionStage === 'pinging') {
        pc.managerMiddleware?.get(PingMiddleware)?.resolvePing(false)
        this.logger.warn(`Reconnecting after reload to ${nickname}...`)
      } else {
        this.logger.warn(`Reconnecting after remote peer wish to ${nickname}...`)
      }

      this.createConnection(targetPeerId, false, np)
    }

    this.onPeerConnectionChanged?.(targetPeerId, 'negotiating')
    const managerMiddleware = await this.connections[targetPeerId].connect(np)

    if (managerMiddleware) {
      this.actions.registerCallbacksAndData(managerMiddleware, targetPeerId)
    } else {
      this.connections[targetPeerId].disconnect()
    }
  }

  private isPeerAllowedToConnect(targetPeerId: string, manual: boolean, incoming: boolean): boolean {
    if (manual) return true
    return !this.blackList.has(targetPeerId) &&
      this.config.autoconnect &&
      this.peers.length < AppConfig.maxNumberOfPeers &&
      (incoming || this.peers.length < AppConfig.maxNumberOfOutgoingConnections)
  }

  private createOnPeerConnectionChanged(targetPeerId: string) {
    return (status: connectionStageType, block?: boolean, error?: boolean) => {
      if (status === "disconnected") {
        delete this.connections[targetPeerId]
        if (block) {
          this.blackList.add(targetPeerId)
        } else {
          if (error && this.config.autoreconnect) {
            this.logger.warn(`Reconnecting after error to ${this.actions.targetPeerNickname(targetPeerId)}.`)
            this.createConnection(targetPeerId)
          }
        }
      } else if (status === "connected") {
        this.logger.success(`Connected to ${this.actions.targetPeerNickname(targetPeerId)}.`);
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