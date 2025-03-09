import {FirebaseSignaling} from "./firebase-realtime-db.ts";
import {PeerConnection} from "./webrtc-conn.ts";

export async function main() {
  const peerId = Math.random().toString(36).substr(2, 9)
  const signaling = new FirebaseSignaling(peerId);
  await signaling.registerPeer()

  // console.log(await signaling.getAvailablePeers())

  let peerConnection: PeerConnection;

  signaling.subscribeToNewPeers((targetPeer) => {
    // Create a WebRTC connection instance.
    // Pass callbacks to send ICE candidates via Firebase and to process messages from the data channel.
    peerConnection = new PeerConnection(
      (candidate) => {
        // When a new ICE candidate is found, send it to Firebase.
        signaling.sendIceCandidate(targetPeer.peerId, candidate.toJSON());
      },
      (message) => {
        // Handle incoming messages on the data channel.
        console.log("Received message over WebRTC:", message);
      }
    );

    peerConnection.startDebugListeners()

    // Determine which one is answerer
    if (targetPeer.data.ready && peerId < targetPeer.peerId) {
      console.log("I am answerer")
      // Listen for an SDP offer from a remote peer.
      signaling.onOffer(targetPeer.peerId, async (offer) => {
        // console.log("Received offer via Firebase:", offer);
        // Process the received offer using the WebRTC connection.
        const answer = await peerConnection.handleOffer(offer);
        // Send the generated answer back via Firebase.
        signaling.sendAnswer(targetPeer.peerId, answer);
      });
    } else {
      console.log("I am offerer")
      // Create an offer and send it via Firebase.
      peerConnection.createOffer().then((offer) => {
        signaling.sendOffer(targetPeer.peerId, offer);
      });

      // Listen for an SDP answer from the remote peer.
      signaling.onAnswer(targetPeer.peerId, async (answer) => {
        // console.log("Received answer via Firebase:", answer);
        await peerConnection.handleAnswer(answer);
      });

      // Create a data channel.
      // peerConnection.createDataChannel();
    }

    // Listen for new ICE candidates from the remote peer.
    signaling.onIceCandidate(targetPeer.peerId, async (candidate) => {
      // console.log("Received ICE candidate via Firebase:", candidate);
      await peerConnection.addIceCandidate(candidate);
    });
  })

  // Optionally, after connection is established, you can clean up the signaling data:
  // signaling.cleanup();
  return () => peerConnection.send("Hello from WebRTC via Firebase signaling!")
}

