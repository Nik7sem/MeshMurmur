import {FirebaseSignaling} from "./signaling/firebase-signaling.ts";
import {PeerConnection} from "./webrtc-conn.ts";
import {Logger} from "@/utils/p2p-library/abstract.ts";

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

export async function main(onMessage: (message: string) => void) {
  const peerId = Math.random().toString(36).substr(2, 9)
  const signaler = new FirebaseSignaling(peerId);
  const logger = new ConsoleLogger()
  const connections: { [peerId: string]: PeerConnection } = {}
  await signaler.registerPeer()

  console.log("Registered peer:", peerId);

  // console.log(await signaling.getAvailablePeers())

  signaler.onInvite((targetPeerId) => {
    if (targetPeerId in connections) return console.log("Ignore invite from:", targetPeerId);
    console.log("Received invite from:", targetPeerId);
    connections[targetPeerId] = new PeerConnection(signaler, logger, targetPeerId, peerId > targetPeerId, onMessage)
  })

  signaler.subscribeToNewPeers((targetPeer) => {
    console.log("New peer detected:", targetPeer.peerId);
    if (targetPeer.peerId in connections) return

    connections[targetPeer.peerId] = new PeerConnection(signaler, logger, targetPeer.peerId, peerId > targetPeer.peerId, onMessage)
    signaler.sendInvite(targetPeer.peerId)
    console.log("Send invite to:", targetPeer.peerId);
  })

  // Optionally, after connection is established, you can clean up the signaling data:
  // signaling.cleanup();
  return connections
}

