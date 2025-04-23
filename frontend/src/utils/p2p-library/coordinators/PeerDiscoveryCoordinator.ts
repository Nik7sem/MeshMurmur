import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {getRandomSample} from "@/utils/getRandomSample.ts";
import {DiscoveryMiddleware} from "@/utils/p2p-library/middlewares/discoveryMiddleware.ts";
import {TypedEventEmitter} from "@/utils/eventEmitter.ts";

export type PeerInfoType = {
  peerId: string;
  connections: {
    peerId: string;
    connected: boolean,
    connectionType: string
  }[];
  updatedAt: number;
}

export class PeerDiscoveryCoordinator {
  public peerMap: { [key: string]: PeerInfoType } = {};
  public eventEmitter = new TypedEventEmitter<{ mapChanged: void }>();
  private GossipInterval = Math.random() * 6000 + 3000
  private sampleSize = 3
  private maxAge = 12_000

  constructor(private connector: Connector) {
    this.updateSelfConnections()
    this.connector.onPeerConnectionChanged = () => {
      this.updateSelfConnections()
    }
    setInterval(() => {
      this.peerMap = this.getCleanPeerMap()
      this.updateSelfConnections()
      const knownPeers = Object.values(this.peerMap)
      getRandomSample(this.connector.connectedPeers, this.sampleSize).forEach((peer) => {
        peer.managerMiddleware.get(DiscoveryMiddleware)?.sendGossipMessage(knownPeers)
      })
    }, this.GossipInterval)
  }

  updateSelfConnections() {
    this.peerMap[this.connector.peerId] = {
      peerId: this.connector.peerId,
      connections: this.connector.peers.map(peer => (
        {peerId: peer.targetPeerId, connected: peer.connected, connectionType: peer.connectionType}
      )),
      updatedAt: Date.now()
    }
    this.eventEmitter.emit('mapChanged');
  }

  mergeGossip(received: PeerInfoType[]) {
    let changed = false;
    for (const info of received) {
      if (!(info.peerId in this.peerMap) || info.updatedAt > this.peerMap[info.peerId].updatedAt) {
        this.peerMap[info.peerId] = info;
        changed = true;
      }
    }
    if (changed) this.eventEmitter.emit('mapChanged')
  }

  getCleanPeerMap(): { [key: string]: PeerInfoType } {
    const now = Date.now();
    const result: { [key: string]: PeerInfoType } = {};
    for (const key in this.peerMap) {
      if (now - this.peerMap[key].updatedAt < this.maxAge) {
        result[key] = this.peerMap[key];
      }
    }
    return result;
  }
}