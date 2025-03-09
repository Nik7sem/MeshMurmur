import {initializeApp, FirebaseApp} from "firebase/app";
import {
  getDatabase,
  Database,
  ref,
  set,
  push,
  onValue,
  onChildAdded,
  DataSnapshot,
  remove
} from "firebase/database";
import {FirebaseOptions} from "@firebase/app";

// Define types for the SDP and ICE candidate objects.
type SDPMessage = RTCSessionDescriptionInit;
type ICECandidateMessage = RTCIceCandidateInit;

const firebaseConfig: FirebaseOptions = {
  databaseURL: "https://meshmurmur-default-rtdb.europe-west1.firebasedatabase.app/"
};

interface OfferData {
  sender: string;
  offer: SDPMessage;
}

interface AnswerData {
  sender: string;
  answer: SDPMessage;
}

interface CandidateData {
  sender: string;
  candidate: ICECandidateMessage;
}

export class FirebaseSignaling {
  private firebaseApp: FirebaseApp;
  private db: Database;
  private roomRef: ReturnType<typeof ref>;
  // Unique identifier for this peer.
  private peerId: string;

  /**
   * Constructs a new FirebaseSignaling instance.
   *
   * @param roomId - The room identifier to use for exchanging signaling data.
   * @param peerId - (Optional) Provide your own peer ID; if omitted, a random one is generated.
   */
  constructor(private roomId: string, peerId?: string) {
    // Generate a unique peer ID if not provided.
    this.peerId = peerId || Math.random().toString(36).substr(2, 9);
    // Initialize Firebase app and database.
    this.firebaseApp = initializeApp(firebaseConfig);
    this.db = getDatabase(this.firebaseApp);
    // Create a reference to a room in the database.
    this.roomRef = ref(this.db, `rooms/${this.roomId}`);
  }

  /**
   * Sends an SDP offer to the Firebase room.
   *
   * @param offer - The SDP offer object from your peer connection.
   */
  async sendOffer(offer: SDPMessage): Promise<void> {
    const offerRef = ref(this.db, `rooms/${this.roomId}/offer`);
    const data: OfferData = {sender: this.peerId, offer};
    await set(offerRef, data);
    console.log("Offer sent to Firebase:", data);
  }

  /**
   * Sends an SDP answer to the Firebase room.
   *
   * @param answer - The SDP answer object from your peer connection.
   */
  async sendAnswer(answer: SDPMessage): Promise<void> {
    const answerRef = ref(this.db, `rooms/${this.roomId}/answer`);
    const data: AnswerData = {sender: this.peerId, answer};
    await set(answerRef, data);
    console.log("Answer sent to Firebase:", data);
  }

  /**
   * Sends an ICE candidate to the Firebase room.
   * Each candidate is pushed to a list so that multiple candidates can be exchanged.
   *
   * @param candidate - The ICE candidate object from your peer connection.
   */
  async sendIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    const candidateListRef = ref(this.db, `rooms/${this.roomId}/candidates`);
    const data: CandidateData = {sender: this.peerId, candidate};
    await push(candidateListRef, data);
    console.log("ICE candidate sent to Firebase:", data);
  }

  /**
   * Listens for an SDP offer in the Firebase room.
   *
   * @param callback - A function that receives the SDP offer when it is set.
   */
  onOffer(callback: (offer: SDPMessage) => void): void {
    const offerRef = ref(this.db, `rooms/${this.roomId}/offer`);
    onValue(offerRef, (snapshot: DataSnapshot) => {
      const data: OfferData = snapshot.val();
      // Ignore the offer if it's from ourselves.
      if (data && data.sender !== this.peerId) {
        console.log("Offer received from Firebase:", data);
        callback(data.offer);
      }
    });
  }

  /**
   * Listens for an SDP answer in the Firebase room.
   *
   * @param callback - A function that receives the SDP answer when it is set.
   */
  onAnswer(callback: (answer: SDPMessage) => void): void {
    const answerRef = ref(this.db, `rooms/${this.roomId}/answer`);
    onValue(answerRef, (snapshot: DataSnapshot) => {
      const data: AnswerData = snapshot.val();
      // Ignore the answer if it's from ourselves.
      if (data && data.sender !== this.peerId) {
        console.log("Answer received from Firebase:", data);
        callback(data.answer);
      }
    });
  }

  /**
   * Listens for new ICE candidates in the Firebase room.
   * This uses "child_added" so that each new candidate is processed as it is added.
   *
   * @param callback - A function that receives each new ICE candidate.
   */
  onIceCandidate(callback: (candidate: ICECandidateMessage) => void): void {
    const candidateListRef = ref(this.db, `rooms/${this.roomId}/candidates`);
    onChildAdded(candidateListRef, (snapshot: DataSnapshot) => {
      const data: CandidateData = snapshot.val();
      // Ignore candidate if it's from ourselves.
      if (data && data.sender !== this.peerId) {
        console.log("ICE candidate received from Firebase:", data);
        callback(data.candidate);
      }
    });
  }

  /**
   * Optional: Clean up the signaling data after connection is established.
   */
  async cleanup(): Promise<void> {
    await remove(ref(this.db, `rooms/${this.roomId}/offer`));
    await remove(ref(this.db, `rooms/${this.roomId}/answer`));
    await remove(ref(this.db, `rooms/${this.roomId}/candidates`));
    console.log("Cleaned up signaling data in room:", this.roomId);
  }
}
