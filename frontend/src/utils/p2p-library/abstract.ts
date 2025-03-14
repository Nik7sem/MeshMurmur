import {ConnectionData, messageDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";
import {Logger} from "../logger.ts";

export class Signaler {
  send(targetPeerId: string, connectionData: ConnectionData) {
    throw new Error("Not implemented");
  }

  on(targetPeerId: string, callback: (connectionData: ConnectionData) => void) {
    throw new Error("Not implemented");
  }

  off(targetPeerId: string) {
    throw new Error("Not implemented");
  }

  cleanup(targetPeerId: string) {
    throw new Error("Not implemented");
  }
}

export class Middleware {
  constructor(
    protected send: (data: messageDataType) => void,
    protected conn: PeerConnection,
    protected logger: Logger
  ) {
  }

  // on datachannel open
  init() {
    throw new Error("Not implemented");
  }

  // call middleware on new message
  call(data: messageDataType): boolean {
    throw new Error("Not implemented");
  }
}