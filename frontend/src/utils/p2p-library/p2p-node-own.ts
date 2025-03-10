import {FirebaseSignaling} from "./signaling/firebase-signaling.ts";
import {PeerConnection} from "./webrtc-conn.ts";
import {Logger} from "@/utils/p2p-library/abstract.ts";
import {logType} from "@/utils/p2p-library/types.ts";
import {formatConsoleLog} from "@/utils/formatConsoleLog.ts";

class ConsoleLogger extends Logger {
  log(...args: any[]) {
    console.log(...args);
  }

  warn(...args: any[]) {
    console.warn(...args)
  }

  error(...args: any[]) {
    console.error(...args)
  }
}

export async function main(peerId: string, addLog: (log: logType) => void, onMessage: (text: string, peerId: string) => void) {
  class ReactLogger extends Logger {
    info(...args: any[]) {
      addLog({text: formatConsoleLog(...args), type: "info"});
    }

    warn(...args: any[]) {
      addLog({text: formatConsoleLog(...args), type: "warn"});
    }

    error(...args: any[]) {
      addLog({text: formatConsoleLog(...args), type: "error"});
    }
  }

  const signaler = new FirebaseSignaling(peerId);
  const logger = new ReactLogger()
  const connections: { [peerId: string]: PeerConnection } = {}
  await signaler.registerPeer()

  logger.info("Registered peer:", peerId);

  // console.log(await signaling.getAvailablePeers())

  signaler.onInvite((targetPeerId) => {
    if (targetPeerId in connections) return logger.info("Ignore invite from:", targetPeerId);
    logger.info("Received invite from:", targetPeerId);
    connections[targetPeerId] = new PeerConnection(signaler, logger, targetPeerId, peerId > targetPeerId, onMessage)
  })

  signaler.subscribeToNewPeers((targetPeer) => {
    logger.info("New peer detected:", targetPeer.peerId);
    if (targetPeer.peerId in connections) return

    connections[targetPeer.peerId] = new PeerConnection(signaler, logger, targetPeer.peerId, peerId > targetPeer.peerId, onMessage)
    signaler.sendInvite(targetPeer.peerId)
    logger.info("Send invite to:", targetPeer.peerId);
  })

  // Optionally, after connection is established, you can clean up the signaling data:
  // signaling.cleanup();
  return connections
}

