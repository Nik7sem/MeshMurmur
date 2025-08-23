import {Logger} from '../../logger.ts'
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {AppConfig} from "@/utils/p2p-library/conf.ts";
import {ActionManager} from "@/utils/p2p-library/connection/actionManager.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {createSignaler} from "@/utils/p2p-library/signalers/createSignaler.ts";
import {connectionStageType, signalerNameType} from "@/utils/p2p-library/types.ts";
import {PingMiddleware} from "@/utils/p2p-library/middlewares/pingMiddleware.ts";

export class Connector {
  private readonly signaler: Signaler;
  public connections: { [peerId: string]: PeerConnection } = {}
  public actions: ActionManager
  public onPeerConnectionChanged?: (targetPeerId: string, status: connectionStageType) => void
  public blackList: Set<string> = new Set()
  public potentialPeers: Set<string> = new Set()

  constructor(
    public peerId: string,
    signaler: signalerNameType,
    private autoconnect: boolean,
    private logger: Logger,
  ) {
    this.actions = new ActionManager(this, logger);
    this.signaler = createSignaler(signaler, this.peerId, this.logger);
  }

  async init() {
    // TODO: Add peer reconnecting

    const connect = (targetPeerId: string) => {
      this.logger.info(`Discovered peer: ${targetPeerId}`);
      this.createConnection(targetPeerId);
    }

    const disconnect = async (removedPeerId: string) => {
      this.logger.info(`Removed peer: ${removedPeerId}`);
      if (removedPeerId in this.connections) {
        if (await this.connections[removedPeerId].disconnect()) {
          this.logger.warn(`${this.actions.targetPeerNickname(removedPeerId)} disconnected by exit`);
        }
      }
      this.potentialPeers.delete(removedPeerId);
    }

    this.signaler.onInvite((targetPeerId) => {
      this.createConnection(targetPeerId, false);
    })

    this.signaler.subscribeToPeers(connect, disconnect, (peers) => {
        const peersSet = new Set(peers)
        for (const peerId of this.potentialPeers) {
          if (!peersSet.has(peerId)) {
            disconnect(peerId);
          }
        }
        for (const peerId of peersSet) {
          if (!this.potentialPeers.has(peerId)) {
            connect(peerId);
          }
        }
      }
    )

    this.signaler.registerPeer({ready: this.autoconnect})
    this.logger.info(`Registered peer [${this.signaler.info()}]:`, this.peerId);
  }

  public setAutoconnect(autoconnect: boolean) {
    this.autoconnect = autoconnect;
    this.signaler.setPeerData({ready: this.autoconnect});
  }

  public async createConnection(targetPeerId: string, outgoing = true, manual = false) {
    if (targetPeerId === this.peerId) return

    this.potentialPeers.add(targetPeerId);

    if (targetPeerId in this.connections) {
      if (!outgoing && ['pinging', 'connecting'].includes(this.connections[targetPeerId].connectionStage)) {
        this.connections[targetPeerId].connectionStage = 'reconnecting'
        this.connections[targetPeerId].managerMiddleware.get(PingMiddleware)?.resolvePing(false)
        await this.connections[targetPeerId].disconnect(false, true)
      } else {
        return
      }
    }

    if (!manual) {
      if (this.blackList.has(targetPeerId)) return
      if (!this.autoconnect) return
      if (this.peers.length >= AppConfig.maxNumberOfPeers) return
      if (outgoing && this.peers.length >= AppConfig.maxNumberOfOutgoingConnections) return
    }

    if (outgoing) {
      this.signaler.sendInvite(targetPeerId)
      this.logger.info("Send invite to:", targetPeerId);
    } else {
      this.logger.info("Received invite from:", targetPeerId);
    }
    this.connections[targetPeerId] = new PeerConnection(this.peerId, targetPeerId, this.logger, this.signaler, this.createOnPeerConnectionChanged(targetPeerId));
    this.actions.registerCallbacksAndData(targetPeerId)
    this.onPeerConnectionChanged?.(targetPeerId, 'connecting')
  }

  private createOnPeerConnectionChanged(targetPeerId: string) {
    return (status: connectionStageType, block: boolean) => {
      if (status === "disconnected") {
        delete this.connections[targetPeerId]
        if (block) {
          this.blackList.add(targetPeerId)
        }
      } else if (status === "connected") {
        // TODO: Remove this, and make proper solution with callback when all middlewares fully initialized
        // Temporal solution
        setTimeout(() => {
          this.logger.success(`Connected to ${this.actions.targetPeerNickname(targetPeerId)}`);
        }, 1000)
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