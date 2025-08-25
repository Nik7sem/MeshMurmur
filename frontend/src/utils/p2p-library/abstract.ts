import {ChannelEventBase, ConnectionData, eventDataType, PeerDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {Logger} from "../logger.ts";

export abstract class BasicSignaler {
  abstract send(targetPeerId: string, connectionData: ConnectionData): void

  abstract on(targetPeerId: string, callback: (connectionData: ConnectionData) => void): void

  abstract off(targetPeerId: string): void
}

export abstract class Signaler extends BasicSignaler {
  public onInvite?: (peerId: string) => void
  public onAddedPeer?: (peerId: string) => void
  public onRemovedPeer?: (peerId: string) => void
  public onPeerList?: (peerIds: string[]) => void

  protected sdpCallbacks: { [key: string]: (connectionData: ConnectionData) => void } = {}
  protected sdpCache: { [key: string]: ConnectionData[] } = {}

  protected constructor(
    protected readonly logger: Logger,
  ) {
    super()
  }

  abstract info(): string;

  abstract registerPeer(peerData: PeerDataType): void

  abstract sendInvite(targetPeerId: string): void

  abstract setPeerData(peerData: PeerDataType): void

  on(targetPeerId: string, callback: (connectionData: ConnectionData) => void) {
    this.sdpCallbacks[targetPeerId] = callback
    if (targetPeerId in this.sdpCache && this.sdpCache[targetPeerId].length > 0) {
      this.logger.warn("Cached SDP used!")
      for (const connectionData of this.sdpCache[targetPeerId]) {
        callback(connectionData)
      }
      delete this.sdpCache[targetPeerId]
    }
  }

  off(targetPeerId: string) {
    if (targetPeerId in this.sdpCache) delete this.sdpCache[targetPeerId]
    if (targetPeerId in this.sdpCallbacks) delete this.sdpCallbacks[targetPeerId]
  }

  onSDP(sdp: ConnectionData, from: string) {
    if (from in this.sdpCallbacks) {
      this.sdpCallbacks[from](sdp)
    } else {
      if (!(from in this.sdpCallbacks)) {
        this.sdpCache[from] = []
      }
      this.sdpCache[from].push(sdp)
    }
  }
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