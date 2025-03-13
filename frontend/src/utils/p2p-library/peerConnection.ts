import {FirebaseSignaler} from "@/utils/p2p-library/signaling/firebase-signaler.ts";
import {connectionsType, messageDataType} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/p2p-library/logger.ts";
import {parseRTCStats} from "@/utils/p2p-library/parseRTCStart.ts";

function createOnFinalState(targetPeerId: string, connections: connectionsType, logger: Logger) {
  return async (state: RTCPeerConnectionState | "timeout") => {
    if (state === "connected") {
      connections[targetPeerId].info.connected = true
      const stats = await connections[targetPeerId].pc.getStats()
      const {info} = parseRTCStats(stats)
      if (info) {
        logger.info(`Candidates info: `, info);
        logger.success(`Connection is using ${info.type} server.`);
        connections[targetPeerId].info.type = info.type
      }
      logger.success("Successfully connected to peer!")
    } else {
      connections[targetPeerId].pc.cleanup()
      delete connections[targetPeerId]
      logger.error(`Error in connection to peer: ${state}!`)
    }
  }
}

export class PeerConnection {
  private onData: ({peerId, text}: messageDataType) => void
  private onMessage?: ({peerId, text}: messageDataType) => void

  constructor(
    private peerId: string,
    private logger: Logger,
    private signaler: FirebaseSignaler
  ) {
    this.onData = ({peerId, text}: messageDataType) => {
      this.onMessage?.({peerId, text})
    }
  }


}