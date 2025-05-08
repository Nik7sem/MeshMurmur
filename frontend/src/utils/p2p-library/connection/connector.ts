import {Logger} from '../../logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signalers/firebase-signaler.ts";
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {getRandomSample} from "@/utils/getRandomSample.ts";
import {AppConfig} from "@/utils/p2p-library/conf.ts";
import {ActionManager} from "@/utils/p2p-library/connection/actionManager.ts";

export class Connector {
  private readonly signaler: FirebaseSignaler;
  public connections: { [peerId: string]: PeerConnection } = {}
  public actions: ActionManager
  public onPeerConnectionChanged?: (targetPeerId: string, status: 'connected' | 'connecting' | 'disconnected') => void
  public blackList: Set<string> = new Set()
  public potentialPeers: Set<string> = new Set()

  constructor(
    public peerId: string,
    private autoconnect: boolean,
    private logger: Logger,
  ) {
    this.actions = new ActionManager(this, logger);
    this.signaler = new FirebaseSignaler(this.peerId);
  }

  async init() {
    await this.signaler.registerPeer({ready: this.autoconnect})
    this.logger.info("Registered peer:", this.peerId);

    // TODO: Add peer reconnecting
    for (const potentialPeerId of await this.signaler.getAvailablePeers()) {
      this.potentialPeers.add(potentialPeerId);
    }

    for (const targetPeerId of getRandomSample(this.potentialPeers, AppConfig.maxNumberOfPeers)) {
      this.createConnection(targetPeerId);
    }

    this.signaler.onInvite((targetPeerId) => {
      this.createConnection(targetPeerId, false);
    })

    this.signaler.subscribeToPeers((targetPeerId) => {
        this.createConnection(targetPeerId);
      }, (oldPeerId) => {
        if (oldPeerId in this.connections) {
          this.logger.warn(`${this.actions.targetPeerNickname(oldPeerId)} disconnected by exit`);
          this.connections[oldPeerId].disconnect();
        }
        this.potentialPeers.delete(oldPeerId);
      }
    )
  }

  public setAutoconnect(autoconnect: boolean) {
    this.autoconnect = autoconnect;
    this.signaler.setPeerData({ready: this.autoconnect});
  }

  public createConnection(targetPeerId: string, outgoing = true, manual = false) {
    this.potentialPeers.add(targetPeerId);

    if (targetPeerId in this.connections) return
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
    return (status: 'connected' | 'disconnected', block: boolean) => {
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
    return this.peers.filter((conn) => conn.connected)
  }

  cleanup() {
  }
}