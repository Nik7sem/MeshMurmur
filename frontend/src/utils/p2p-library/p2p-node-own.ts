// Import the classes (assuming they're in separate files)
import {FirebaseSignaling} from "./firebase-realtime-db.ts";
import {PeerConnection} from "./webrtc-conn.ts";

// Your Firebase configuration (minimal config for testing can be just the databaseURL)

const roomId = "exampleRoom";

export async function main() {
// Create a FirebaseSignaling instance with a unique peer ID (optional: let it generate one)
  const signaling = new FirebaseSignaling(roomId);

// Create a WebRTC connection instance.
// Pass callbacks to send ICE candidates via Firebase and to process messages from the data channel.
  const peerConnection = new PeerConnection(
    (candidate) => {
      // When a new ICE candidate is found, send it to Firebase.
      signaling.sendIceCandidate(candidate.toJSON());
    },
    (message) => {
      // Handle incoming messages on the data channel.
      console.log("Received message over WebRTC:", message);
    }
  );

// --- Set up Firebase listeners for signaling data ---

// Listen for an SDP offer from a remote peer.
  signaling.onOffer(async (offer) => {
    console.log("Received offer via Firebase:", offer);
    // Process the received offer using the WebRTC connection.
    const answer = await peerConnection.handleOffer(offer);
    // Send the generated answer back via Firebase.
    signaling.sendAnswer(answer);
  });

// Listen for an SDP answer from the remote peer.
  signaling.onAnswer(async (answer) => {
    console.log("Received answer via Firebase:", answer);
    await peerConnection.handleAnswer(answer);
  });

// Listen for new ICE candidates from the remote peer.
  signaling.onIceCandidate(async (candidate) => {
    console.log("Received ICE candidate via Firebase:", candidate);
    await peerConnection.addIceCandidate(candidate);
  });

// --- Initiating the Connection ---
// If you're the offerer (initiator):
  peerConnection.createDataChannel(); // Create a data channel.
// peerConnection.onDataChannelOpen = () => {
//   // Once the data channel is open, send a message.
//   peerConnection.send("Hello from WebRTC via Firebase signaling!");
// };
// Create an offer and send it via Firebase.
  peerConnection.createOffer().then((offer) => {
    signaling.sendOffer(offer);
  });

// Optionally, after connection is established, you can clean up the signaling data:
// signaling.cleanup();
  return () => peerConnection.send("Hello from WebRTC via Firebase signaling!")
}

