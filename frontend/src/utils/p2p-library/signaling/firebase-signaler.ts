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
import {ConnectionData, PeerType} from "@/utils/p2p-library/types.ts";
import {firebaseConfig} from "@/utils/p2p-library/conf.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";

export class FirebaseSignaler extends Signaler {
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
    const descriptionRef = ref(this.db, `peers/${targetPeerId}/invite`);
    await set(descriptionRef, this.peerId);
  }

  async send(targetPeerId: string, connectionData: ConnectionData) {
    const connectionRef = ref(this.db, `peers/${targetPeerId}/connections/${this.peerId}`);
    await set(connectionRef, connectionData);
  }

  onInvite(callback: (targetPeerId: string) => void) {
    const candidateListRef = ref(this.db, `peers/${this.peerId}/invite`);
    onValue(candidateListRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
  }

  on(targetPeerId: string, callback: (connectionData: ConnectionData) => void) {
    const connectionRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}`);
    onValue(connectionRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
  }

  async cleanup(): Promise<void> {
    await remove(ref(this.db, `peers/${this.peerId}`));
  }
}
