import {Middleware} from "@p2p-library/abstract.ts";
import {eventDataType} from "@p2p-library/types.ts";
import {PeerInfoType} from "@p2p-library/coordinators/PeerDiscoveryCoordinator.ts";

type GossipMessage = {
  from: string,
  knownPeers: PeerInfoType[]
}

export class DiscoveryMiddleware extends Middleware {
  static name = "DiscoveryMiddleware"
  public onGossipMessage?: (data: GossipMessage) => void;

  call(eventData: eventDataType): boolean {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'unreliable') return true
    if (eventData.type === 'gossip') {
      this.onGossipMessage?.(eventData.data as GossipMessage)
      return false
    }
    return true
  }

  sendGossipMessage(knownPeers: GossipMessage['knownPeers']) {
    this.channel.unreliable.send({data: {from: this.peerId, knownPeers}, type: 'gossip'});
  }
}