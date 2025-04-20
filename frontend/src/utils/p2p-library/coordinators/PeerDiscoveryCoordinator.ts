import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {getRandomSample} from "@/utils/getRandomSample.ts";
import {DiscoveryMiddleware} from "@/utils/p2p-library/middlewares/discoveryMiddleware.ts";

export type PeerInfoType = {
  peerId: string;
  connections: string[];
  updatedAt: number;
}

export class PeerDiscoveryCoordinator {
  public peerMap: { [key: string]: PeerInfoType } = {};
  private GossipInterval = 4000
  private sampleSize = 3

  constructor(private connector: Connector) {
    this.connector.onPeerConnectionChanged = (targetPeerId, status) => {
      if (status === 'connected') {
        this.peerMap[targetPeerId] = {
          peerId: targetPeerId,
          connections: [this.connector.peerId],
          updatedAt: Date.now()
        }
      } else if (status === 'disconnected') {
        delete this.peerMap[targetPeerId]
      }
    }
    setInterval(() => {
      const knownPeers = Object.values(this.peerMap)
      getRandomSample(this.connector.connectedPeers, this.sampleSize).forEach((peer) => {
        peer.managerMiddleware.get(DiscoveryMiddleware)?.sendGossipMessage(knownPeers)
      })
    }, this.GossipInterval)
  }

  mergeGossip(received: PeerInfoType[]) {
    console.log("Received", received)
    for (const info of received) {
      if (!(info.peerId in this.peerMap) || info.updatedAt > this.peerMap[info.peerId].updatedAt) {
        this.peerMap[info.peerId] = info;
      }
    }
  }
}