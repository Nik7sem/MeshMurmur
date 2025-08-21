import {
  getDatabase,
  Database,
  ref,
  set,
  push,
  onChildAdded,
  onChildRemoved,
  onDisconnect,
  off,
  remove,
  get,
  DataSnapshot,
} from "firebase/database";
import {ConnectionData, PeerDataType} from "@/utils/p2p-library/types.ts";
import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {FirebaseOptions, initializeApp} from "firebase/app";

export interface FirebaseSignalerInterface {
  type: 'firebase';
  config: FirebaseOptions;
}

export class FirebaseSignaler extends Signaler {
  private readonly db: Database;

  constructor(
    private readonly peerId: string,
    config: FirebaseOptions,
  ) {
    super()
    this.db = getDatabase(initializeApp(config));
  }

  info() {
    return `FirebaseSignaler`
  }

  async registerPeer(peerData: PeerDataType) {
    const peerRef = ref(this.db, `peers/${this.peerId}`);
    await set(peerRef, peerData);

    // remove on disconnect
    onDisconnect(peerRef).remove().catch((err) => {
      if (err) {
        console.error("could not establish onDisconnect event", err);
      }
    })
  }

  async setPeerData(peerData: PeerDataType) {
    const peerRef = ref(this.db, `peers/${this.peerId}`);
    await set(peerRef, peerData);
  }

  private async getAvailablePeers() {
    const peersRef = ref(this.db, "peers");
    const snapshot = await get(peersRef);
    if (!snapshot.exists()) return [];
    return Object.keys(snapshot.val()).filter((id) => id !== this.peerId);
  }

  subscribeToPeers(
    addPeer: (peerId: string) => void,
    removePeer: (peerId: string) => void,
    updatePeerList: (peerIds: string[]) => void
  ) {
    this.getAvailablePeers().then(peers => updatePeerList(peers));

    const peersRef = ref(this.db, "peers");
    onChildAdded(peersRef, (snapshot: DataSnapshot) => {
      const peerId = snapshot.key!
      if (peerId && peerId !== this.peerId) {
        addPeer(peerId);
      }
    })

    onChildRemoved(peersRef, (snapshot: DataSnapshot) => {
      const peerId = snapshot.key!
      if (peerId && peerId !== this.peerId) {
        removePeer(peerId);
      }
    })
  }

  unsubscribeFromNewPeers() {
    const peersRef = ref(this.db, "peers");
    off(peersRef, "child_added");
    off(peersRef, "child_removed");
  }

  async sendInvite(targetPeerId: string) {
    const descriptionRef = ref(this.db, `peers/${targetPeerId}/invites`);
    await push(descriptionRef, this.peerId);
  }

  async send(targetPeerId: string, connectionData: ConnectionData) {
    const connectionRef = ref(this.db, `peers/${targetPeerId}/connections/${this.peerId}`);
    await push(connectionRef, connectionData);
  }

  onInvite(callback: (targetPeerId: string) => void) {
    const invitesListRef = ref(this.db, `peers/${this.peerId}/invites`);
    onChildAdded(invitesListRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
  }

  on(targetPeerId: string, callback: (connectionData: ConnectionData) => void) {
    const connectionRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}`);
    onChildAdded(connectionRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
  }

  off(targetPeerId: string) {
    const connectionRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}`);
    off(connectionRef, "child_added");
  }

  cleanup(targetPeerId: string) {
    const connectionRef = ref(this.db, `peers/${this.peerId}/connections/${targetPeerId}`);
    remove(connectionRef)
  }
}
