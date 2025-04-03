import {ChannelEventBase, ConnectionData, eventDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";
import {Logger} from "../logger.ts";

export abstract class Signaler {
  abstract send(targetPeerId: string, connectionData: ConnectionData): void

  abstract on(targetPeerId: string, callback: (connectionData: ConnectionData) => void): void

  abstract off(targetPeerId: string): void

  abstract cleanup(targetPeerId: string): void
}

export abstract class Middleware {
  constructor(
    protected conn: PeerConnection,
    protected logger: Logger
  ) {
  }

  // on datachannel open
  init(eventData: ChannelEventBase) {
  }

  // call middleware on new message
  call(eventData: eventDataType): boolean {
    return true
  }

  isBlocked(): boolean {
    return false
  }
}