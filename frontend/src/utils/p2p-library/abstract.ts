import {ICE, SDP} from "@/utils/p2p-library/types.ts";

export class Signaler {
  sendDescription(targetPeerId: string, description: SDP) {
    throw new Error("Not implemented");
  }

  sendCandidate(targetPeerId: string, candidate: ICE) {
    throw new Error("Not implemented");
  }

  onDescription(targetPeerId: string, callback: (description: SDP) => void) {
    throw new Error("Not implemented");
  }

  onCandidate(targetPeerId: string, callback: (candidate: ICE) => void) {
    throw new Error("Not implemented");
  }
}

export class Logger {
  log(...args: any[]) {
    throw new Error("Not implemented");
  }

  warn(...args: any[]) {
    throw new Error("Not implemented");
  }

  error(...args: any[]) {
    throw new Error("Not implemented");
  }
}