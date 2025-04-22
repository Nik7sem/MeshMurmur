import {Logger} from '../../logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signalers/firebase-signaler.ts";
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {getRandomSample} from "@/utils/getRandomSample.ts";
import {connectorConfig} from "@/utils/p2p-library/conf.ts";
import {ActionManager} from "@/utils/p2p-library/connection/actionManager.ts";

export class Connector {
  private readonly signaler: FirebaseSignaler;
  public connections: { [peerId: string]: PeerConnection } = {}
  public actions: ActionManager
  public onPeerConnectionChanged?: (targetPeerId: string, status: 'connected' | 'disconnected') => void
  private blackList: Set<string> = new Set()
  private potentialPeers: Set<string> = new Set()

  constructor(
    public peerId: string,
    private logger: Logger,
  ) {
    this.actions = new ActionManager(this);
    this.signaler = new FirebaseSignaler(this.peerId);
  }

  async init() {
    await this.signaler.registerPeer()
    this.logger.info("Registered peer:", this.peerId);

    // TODO: Add peer reconnecting
    for (const potentialPeerId of await this.signaler.getAvailablePeers()) {
      this.potentialPeers.add(potentialPeerId);
    }

    for (const targetPeerId of getRandomSample(this.potentialPeers, connectorConfig.maxNumberOfPeers)) {
      this.createConnection(targetPeerId);
    }

    this.signaler.onInvite((targetPeerId) => {
      this.createConnection(targetPeerId, false);
    })

    this.signaler.subscribeToPeers((targetPeerId) => {
        this.createConnection(targetPeerId);
      }, (oldPeerId) => {
        if (oldPeerId in this.connections) {
          this.connections[oldPeerId].disconnect();
        }
        this.potentialPeers.delete(oldPeerId);
      }
    )
  }

  private createConnection(targetPeerId: string, outgoing = true) {
    if (
      this.blackList.has(targetPeerId) ||
      targetPeerId in this.connections ||
      this.peers.length >= connectorConfig.maxNumberOfPeers ||
      (outgoing && this.peers.length >= connectorConfig.maxNumberOfOutgoingConnections)
    ) return

    this.potentialPeers.add(targetPeerId);
    if (outgoing) {
      this.signaler.sendInvite(targetPeerId)
      this.logger.info("Send invite to:", targetPeerId);
    } else {
      this.logger.info("Received invite from:", targetPeerId);
    }
    this.connections[targetPeerId] = new PeerConnection(this.peerId, targetPeerId, this.logger, this.signaler, this.createOnPeerConnectionChanged(targetPeerId));
    this.actions.registerCallbacksAndData(targetPeerId)
  }

  private createOnPeerConnectionChanged(targetPeerId: string) {
    return (status: 'connected' | 'disconnected', block: boolean) => {
      if (status === "disconnected") {
        delete this.connections[targetPeerId]
        if (block) {
          this.blackList.add(targetPeerId)
        }
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

  get potentialPeersCount() {
    return this.potentialPeers.size
  }

  cleanup() {
  }
}