import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {getRandomSample} from "@/utils/getRandomSample.ts";
import {DiscoveryMiddleware} from "@/utils/p2p-library/middlewares/discoveryMiddleware.ts";

export type PeerInfoType = {
  peerId: string;
  connections: string[];
  updatedAt: number;
}


export class PeerDiscoveryCoordinator {
  public peerMap: Map<string, PeerInfoType> = new Map();
  private GossipInterval = 4000
  private sampleSize = 3

  constructor(private connector: Connector) {
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
      const existing = this.peerMap.get(info.peerId);
      if (!existing || info.updatedAt > existing.updatedAt) {
        this.peerMap.set(info.peerId, info);
      }
    }
  }
}