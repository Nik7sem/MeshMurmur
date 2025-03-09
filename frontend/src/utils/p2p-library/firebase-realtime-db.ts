import {initializeApp, FirebaseApp} from "firebase/app";
import {
  getDatabase,
  Database,
  ref,
  set,
  push,
  onChildAdded,
  onChildRemoved,
  onValue,
  off,
  remove,
  get,
  DataSnapshot,
} from "firebase/database";
import {FirebaseOptions} from "firebase/app";

// Define types for SDP and ICE candidate messages.
type SDPMessage = RTCSessionDescriptionInit;
type ICECandidateMessage = RTCIceCandidateInit;
type PeerType = { peerId: string, data: { ready: boolean } };

const firebaseConfig: FirebaseOptions = {
  databaseURL: "https://meshmurmur-default-rtdb.europe-west1.firebasedatabase.app/",
};

export class FirebaseSignaling {
  private readonly firebaseApp: FirebaseApp;
  private readonly db: Database;
  // Reference for new-peers subscription.
  private newPeersCallback?: (snapshot: DataSnapshot) => void;

  constructor(private readonly peerId: string) {
    this.firebaseApp = initializeApp(firebaseConfig);
    this.db = getDatabase(this.firebaseApp);
  }

  /**
   * Registers this peer in the global peer list at /peers/$peerId.
   * Sets an onDisconnect to remove your entry automatically.
   */
  async registerPeer(): Promise<void> {
    const peerRef = ref(this.db, `peers/${this.peerId}`);
    await set(peerRef, {ready: true});
    console.log("Registered peer:", this.peerId);
  }

  /**
   * Retrieves all available peer IDs (excluding this peer).
   */
  async getAvailablePeers(): Promise<string[]> {
    const peersRef = ref(this.db, "peers");
    const snapshot = await get(peersRef);
    if (!snapshot.exists()) return [];
    return Object.keys(snapshot.val()).filter((id) => id !== this.peerId);
  }

  /**
   * Subscribes to new peers added to /peers.
   * The callback is called with the new peer's ID.
   */
  subscribeToNewPeers(callback: (newPeer: PeerType) => void): void {
    const peersRef = ref(this.db, "peers");
    this.newPeersCallback = (snapshot: DataSnapshot) => {
      const newPeer: PeerType = {peerId: snapshot.key!, data: snapshot.val()};
      if (newPeer.peerId && newPeer.peerId !== this.peerId) {
        console.log("New peer detected:", newPeer.peerId);
        callback(newPeer);
      }
    };
    onChildAdded(peersRef, this.newPeersCallback);
  }

  /**
   * Unsubscribes from the new peers listener.
   */
  unsubscribeFromNewPeers(): void {
    if (this.newPeersCallback) {
      const peersRef = ref(this.db, "peers");
      off(peersRef, "child_added", this.newPeersCallback);
      this.newPeersCallback = undefined;
      console.log("Unsubscribed from new peers.");
    }
  }

  /**
   * Sends an SDP offer to a target peer.
   * The offer is written under /peers/$targetPeerId/connections/$this.peerId/offer.
   */
  async sendOffer(targetPeerId: string, offer: SDPMessage): Promise<void> {
    const offerRef = ref(this.db, `peers/${targetPeerId}/connections/${this.peerId}/offer`);
    await set(offerRef, {offer});
    console.log(`Offer sent to ${targetPeerId}:`, offer);
  }

  /**
   * Sends an SDP answer to a target peer.
   * The answer is written under /peers/$targetPeerId/connections/${this.peerId}/answer.
   */
  async sendAnswer(targetPeerId: string, answer: SDPMessage): Promise<void> {
    const answerRef = ref(this.db, `peers/${targetPeerId}/connections/${this.peerId}/answer`);
    await set(answerRef, {answer});
    console.log(`Answer sent to ${targetPeerId}:`, answer);
  }

  /**
   * Sends an ICE candidate to a target peer.
   * The candidate is pushed under /peers/$targetPeerId/connections/${this.peerId}/candidates.
   */
  async sendIceCandidate(targetPeerId: string, candidate: ICECandidateMessage): Promise<void> {
    const candidateRef = ref(this.db, `peers/${targetPeerId}/connections/${this.peerId}/candidates`);
    await push(candidateRef, {candidate});
    console.log(`ICE candidate sent to ${targetPeerId}:`, candidate);
  }

  /**
   * Listens for incoming SDP offers directed to this peer.
   * It watches /peers/$this.peerId/connections/$targetPeerId/offer.
   * The callback is called with the sender's peer ID and the offer.
   */
  onOffer(targetPeerId: string, callback: (offer: SDPMessage) => void): void {
    const offerRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}/offer`);
    onValue(offerRef, (snapshot: DataSnapshot) => {
      const data: { offer: RTCSessionDescriptionInit } = snapshot.val();
      if (data) {
        console.log(`Offer received from ${targetPeerId}:`, data.offer);
        callback(data.offer);
      }
    });
  }

  /**
   * Listens for incoming SDP answers directed to this peer.
   * It watches /peers/$this.peerId/connections/$targetPeerId/answer.
   * The callback is called with the sender's peer ID and the answer.
   */
  onAnswer(targetPeerId: string, callback: (answer: SDPMessage) => void): void {
    const answerRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}/answer`);
    onValue(answerRef, (snapshot: DataSnapshot) => {
      const data: { answer: RTCSessionDescriptionInit } = snapshot.val()
      if (data) {
        console.log(`Answer received from ${targetPeerId}:`, data.answer);
        callback(data.answer);
      }
    });
  }

  /**
   * Listens for incoming ICE candidates directed to this peer.
   * It watches /peers/$this.peerId/connections/$targetPeerId/candidates.
   * The callback is called with the sender's peer ID and each candidate.
   */
  onIceCandidate(targetPeerId: string, callback: (candidate: ICECandidateMessage) => void): void {
    const candidateListRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}/candidates`);
    onChildAdded(candidateListRef, (snapshot: DataSnapshot) => {
      const data: { candidate: ICECandidateMessage } = snapshot.val();
      if (data) {
        console.log(`ICE candidate received from ${targetPeerId}:`, data.candidate);
        callback(data.candidate);
      }
    });
  }

  /**
   * Cleans up this peer's data from the Firebase database.
   */
  async cleanup(): Promise<void> {
    await remove(ref(this.db, `peers/${this.peerId}`));
    console.log("Cleaned up peer data for:", this.peerId);
  }
}
