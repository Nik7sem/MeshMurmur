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
import {ICE, PeerType, SDP} from "@/utils/p2p-library/types.ts";
import {firebaseConfig} from "@/utils/p2p-library/conf.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";

export class FirebaseSignaling extends Signaler {
  private readonly firebaseApp: FirebaseApp;
  private readonly db: Database;

  constructor(private readonly peerId: string) {
    super()
    this.firebaseApp = initializeApp(firebaseConfig);
    this.db = getDatabase(this.firebaseApp);
  }

  async registerPeer() {
    const peerRef = ref(this.db, `peers/${this.peerId}`);
    await set(peerRef, {ready: true});
  }

  async getAvailablePeers() {
    const peersRef = ref(this.db, "peers");
    const snapshot = await get(peersRef);
    if (!snapshot.exists()) return [];
    return Object.keys(snapshot.val()).filter((id) => id !== this.peerId);
  }

  subscribeToNewPeers(callback: (newPeer: PeerType) => void) {
    const peersRef = ref(this.db, "peers");
    onChildAdded(peersRef, (snapshot: DataSnapshot) => {
      const newPeer: PeerType = {peerId: snapshot.key!, data: snapshot.val()};
      if (newPeer.peerId && newPeer.peerId !== this.peerId) {
        callback(newPeer);
      }
    })
  }

  unsubscribeFromNewPeers() {
    const peersRef = ref(this.db, "peers");
    off(peersRef, "child_added");
  }

  async sendInvite(targetPeerId: string) {
    const descriptionRef = ref(this.db, `peers/${targetPeerId}/invites`);
    await push(descriptionRef, {peerId: targetPeerId});
  }

  async sendDescription(targetPeerId: string, description: SDP) {
    const descriptionRef = ref(this.db, `peers/${targetPeerId}/connections/${this.peerId}/description`);
    await set(descriptionRef, {description});
  }

  async sendCandidate(targetPeerId: string, candidate: ICE) {
    const candidateRef = ref(this.db, `peers/${targetPeerId}/connections/${this.peerId}/candidates`);
    await push(candidateRef, {candidate});
  }

  onInvite(callback: (targetPeerId: string) => void) {
    const candidateListRef = ref(this.db, `peers/${this.peerId}/invites`);
    onChildAdded(candidateListRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data.peerId);
      }
    });
  }

  onDescription(targetPeerId: string, callback: (description: SDP) => void) {
    const descriptionRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}/description`);
    onValue(descriptionRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data.description);
      }
    });
  }

  onCandidate(targetPeerId: string, callback: (candidate: ICE) => void) {
    const candidateListRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}/candidates`);
    onChildAdded(candidateListRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data.candidate);
      }
    });
  }

  async cleanup(): Promise<void> {
    await remove(ref(this.db, `peers/${this.peerId}`));
  }
}
