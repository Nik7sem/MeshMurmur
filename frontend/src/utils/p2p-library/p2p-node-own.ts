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

export async function main() {
  const peerId = Math.random().toString(36).substr(2, 9)
  const signaler = new FirebaseSignaling(peerId);
  const logger = new ConsoleLogger()
  const connections: { [peerId: string]: { invited: boolean, pc: PeerConnection } } = {}
  await signaler.registerPeer()

  console.log("Registered peer:", peerId);

  // console.log(await signaling.getAvailablePeers())

  signaler.onInvite((targetPeerId) => {
    if (!(targetPeerId in connections)) {
      connections[targetPeerId] = {
        invited: true,
        pc: new PeerConnection(signaler, logger, targetPeerId, peerId > targetPeerId, onMessage)
      }
      signaler.sendInvite(targetPeerId)
    }
  })

  signaler.subscribeToNewPeers((targetPeer) => {
    console.log("New peer detected:", targetPeer.peerId);
    connections[targetPeer.peerId] = {
      invited: true,
      pc: new PeerConnection(signaler, logger, targetPeer.peerId, peerId > targetPeer.peerId, onMessage)
    }
    signaler.sendInvite(targetPeer.peerId)
  })

  function onMessage(message: string) {
    console.log("Received message over WebRTC:", message);
  }

  // Optionally, after connection is established, you can clean up the signaling data:
  // signaling.cleanup();
  return () => connections[Object.keys(connections)[0]].pc.send("Hello from WebRTC via Firebase signaling!")
}

