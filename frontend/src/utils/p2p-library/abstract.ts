import {ConnectionData} from "@/utils/p2p-library/types.ts";

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