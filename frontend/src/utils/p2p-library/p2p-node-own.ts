// Import the classes (assuming they're in separate files)
import {FirebaseSignaling} from "./firebase-realtime-db.ts";
import {PeerConnection} from "./webrtc-conn.ts";

// Your Firebase configuration (minimal config for testing can be just the databaseURL)

export async function main() {
// Create a FirebaseSignaling instance with a unique peer ID (optional: let it generate one)
  const signaling = new FirebaseSignaling();
  await signaling.registerPeer()

  console.log(await signaling.getAvailablePeers())

  let peerConnection: PeerConnection;

  signaling.subscribeToNewPeers((newPeerId) => {
    // Create a WebRTC connection instance.
// Pass callbacks to send ICE candidates via Firebase and to process messages from the data channel.
    peerConnection = new PeerConnection(
      (candidate) => {
        // When a new ICE candidate is found, send it to Firebase.
        signaling.sendIceCandidate(newPeerId, candidate.toJSON());
      },
      (message) => {
        // Handle incoming messages on the data channel.
        console.log("Received message over WebRTC:", message);
      }
    );

// --- Set up Firebase listeners for signaling data ---

// Listen for an SDP offer from a remote peer.
    signaling.onOffer(newPeerId, async (offer) => {
      // console.log("Received offer via Firebase:", offer);
      // Process the received offer using the WebRTC connection.
      const answer = await peerConnection.handleOffer(offer);
      // Send the generated answer back via Firebase.
      signaling.sendAnswer(newPeerId, answer);
    });

// Listen for an SDP answer from the remote peer.
    signaling.onAnswer(newPeerId, async (answer) => {
      // console.log("Received answer via Firebase:", answer);
      await peerConnection.handleAnswer(answer);
    });

// Listen for new ICE candidates from the remote peer.
    signaling.onIceCandidate(newPeerId, async (candidate) => {
      // console.log("Received ICE candidate via Firebase:", candidate);
      await peerConnection.addIceCandidate(candidate);
    });

    peerConnection.createDataChannel(); // Create a data channel.

    // Create an offer and send it via Firebase.
    peerConnection.createOffer().then((offer) => {
      signaling.sendOffer(newPeerId, offer);
    });
  })

// Optionally, after connection is established, you can clean up the signaling data:
// signaling.cleanup();
  return () => peerConnection.send("Hello from WebRTC via Firebase signaling!")
}

