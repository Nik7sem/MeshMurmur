import {Logger} from '../logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signalers/firebase-signaler.ts";
import {messagePeerDataType, textDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";

export class Connector {
  private signaler: FirebaseSignaler;
  private connections: { [peerId: string]: PeerConnection } = {}
  private onData?: (data: messagePeerDataType) => void
  private potentialPeers: Set<string> = new Set()

  constructor(
    private peerId: string,
    private logger: Logger,
  ) {
    this.signaler = new FirebaseSignaler(peerId);
  }

  async init() {
    await this.signaler.registerPeer()
    this.logger.info("Registered peer:", this.peerId);

    for (const potentialPeerId of await this.signaler.getAvailablePeers()) {
      this.potentialPeers.add(potentialPeerId);
    }

    this.signaler.onInvite((targetPeerId) => {
      if (targetPeerId in this.connections) return this.logger.info("Ignore invite from:", targetPeerId);
      this.logger.info("Received invite from:", targetPeerId);
      this.createConnection(targetPeerId);
    })

    this.signaler.subscribeToPeers((targetPeerId) => {
        this.logger.info("New peer detected:", targetPeerId);
        if (targetPeerId in this.connections) return

        this.potentialPeers.add(targetPeerId);

        this.createConnection(targetPeerId);
        this.signaler.sendInvite(targetPeerId)
        this.logger.info("Send invite to:", targetPeerId);
      }, (oldPeerId) => {
        this.potentialPeers.delete(oldPeerId);
      }
    )
  }

  private createConnection(targetPeerId: string) {
    this.connections[targetPeerId] = new PeerConnection(this.peerId, targetPeerId, this.logger, this.signaler, () => {
      delete this.connections[targetPeerId]
    });
    this.connections[targetPeerId].setOnData((data) => this.onData?.(data));
  }

  get peers() {
    return Object.values(this.connections)
  }

  get connectedPeers() {
    return this.peers.filter((conn) => conn.connected)
  }

  get connectingPeersCount() {
    return this.peers.filter((conn) => !conn.connected).length
  }

  get potentialPeersCount() {
    return this.potentialPeers.size
  }

  send({peerId, text}: textDataType) {
    this.connections[peerId].send({data: text, type: 'text'})
  }

  setOnText(onText: (textData: textDataType) => void) {
    this.onData = (messageData: messagePeerDataType) => onText({
      text: messageData.data.data,
      peerId: messageData.peerId
    })
  }

  cleanup() {

  }
}