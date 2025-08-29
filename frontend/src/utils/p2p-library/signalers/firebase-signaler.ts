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
import {Logger} from "@/utils/logger.ts";
import {NegotiationPackageType} from "@/utils/p2p-library/connection/negotiationManager.ts";

type ServerMsg = { t: "negotiation"; from: string; np: any } | { t: "sdp", from: string, sdp: any }

interface FirebaseConfig {
  options: FirebaseOptions;
}

export interface FirebaseSignalerInterface {
  type: 'firebase';
  config: FirebaseConfig;
}

export class FirebaseSignaler extends Signaler {
  private readonly db: Database;

  constructor(
    private readonly peerId: string,
    private readonly config: FirebaseConfig,
    logger: Logger
  ) {
    super(logger);
    this.db = getDatabase(initializeApp(this.config.options));
    this.registerEvents()
  }

  info() {
    return `FirebaseSignaler`
  }

  private registerEvents() {
    const peersRef = ref(this.db, "peers");
    onChildAdded(peersRef, (snapshot: DataSnapshot) => {
      const peerId = snapshot.key
      if (peerId && peerId !== this.peerId) {
        this.logger.info(`Added peer: ${peerId}`);
        this.onAddedPeer?.(peerId);
      }
    })

    onChildRemoved(peersRef, (snapshot: DataSnapshot) => {
      const peerId = snapshot.key
      if (peerId && peerId !== this.peerId) {
        this.logger.info(`Removed peer: ${peerId}`);
        this.onRemovedPeer?.(peerId);
      }
    })

    const messagesRef = ref(this.db, `peers/${this.peerId}/messages`);
    onChildAdded(messagesRef, (snapshot: DataSnapshot) => {
      const msg = snapshot.val() as ServerMsg;
      if (msg && 't' in msg) {
        if (msg.t === "negotiation" && 'from' in msg && 'np' in msg) {
          this.onNegotiationPackage?.(msg.from, msg.np)
        } else if (msg.t === "sdp" && 'from' in msg && 'sdp' in msg) {
          this.onSDP(msg.sdp, msg.from)
        }
      }
      remove(snapshot.ref);
    })
  }

  async registerPeer(peerData: PeerDataType) {
    this.getAvailablePeers().then(peers => this.onPeerList?.(peers));

    const peerRef = ref(this.db, `peers/${this.peerId}`);
    await set(peerRef, peerData);

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

  async __send(targetPeerId: string, data: object) {
    const messagesRef = ref(this.db, `peers/${targetPeerId}/messages`);
    await push(messagesRef, data);
  }

  async sendNegotiationPackage(targetPeerId: string, np: NegotiationPackageType) {
    const data: ServerMsg = {t: "negotiation", from: this.peerId, np};
    await this.__send(targetPeerId, data);
  }

  async send(targetPeerId: string, connectionData: ConnectionData) {
    const data: ServerMsg = {t: "sdp", from: this.peerId, sdp: connectionData};
    await this.__send(targetPeerId, data);
  }
}
