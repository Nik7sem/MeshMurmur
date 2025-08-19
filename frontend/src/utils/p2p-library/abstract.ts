import {ChannelEventBase, ConnectionData, eventDataType, PeerDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {Logger} from "../logger.ts";

export abstract class Signaler {
  abstract send(targetPeerId: string, connectionData: ConnectionData): void

  abstract on(targetPeerId: string, callback: (connectionData: ConnectionData) => void): void

  abstract off(targetPeerId: string): void

  abstract cleanup(targetPeerId: string): void

  abstract registerPeer(peerData: PeerDataType): void

  abstract subscribeToPeers(
    addPeer: (peerId: string) => void,
    removePeer: (peerId: string) => void,
    updatePeerList: (peerIds: string[]) => void
  ): void

  abstract unsubscribeFromNewPeers(): void

  abstract sendInvite(targetPeerId: string): void

  abstract onInvite(callback: (targetPeerId: string) => void): void

  abstract setPeerData(peerData: PeerDataType): void
}

export abstract class Middleware {
  constructor(
    protected conn: PeerConnection,
    protected logger: Logger
  ) {
  }

  // on datachannel open
  async init(eventData: ChannelEventBase) {
  }

  // call middleware on new message
  call(eventData: eventDataType): boolean {
    return true
  }

  isBlocked(): boolean {
    return false
  }
}