import {Logger} from '../logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signalers/firebase-signaler.ts";
import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";
import {getRandomSample} from "@/utils/getRandomSample.ts";
import {
  completeMessageType,
  completeTextType,
  onFileProgressType
} from "@/utils/p2p-library/types.ts";

export class Connector {
  public onCompleteData?: (data: completeMessageType) => void
  public onFileProgress?: onFileProgressType
  public onTyping?: (data: { typing: boolean, peerId: string }) => void
  private readonly signaler: FirebaseSignaler;
  private connections: { [peerId: string]: PeerConnection } = {}
  private blackList: Set<string> = new Set()
  private potentialPeers: Set<string> = new Set()
  private maxNumberOfOutgoingConnections = 5
  private maxNumberOfPeers = 10

  constructor(
    private peerId: string,
    private logger: Logger,
  ) {
    this.signaler = new FirebaseSignaler(peerId);
  }

  async init() {
    await this.signaler.registerPeer()
    this.logger.info("Registered peer:", this.peerId);

    // TODO: Add peer reconnecting
    for (const potentialPeerId of await this.signaler.getAvailablePeers()) {
      this.potentialPeers.add(potentialPeerId);
    }

    for (const targetPeerId of getRandomSample(this.potentialPeers, this.maxNumberOfPeers)) {
      this.createConnection(targetPeerId);
    }

    this.signaler.onInvite((targetPeerId) => {
      this.createConnection(targetPeerId, false);
    })

    this.signaler.subscribeToPeers((targetPeerId) => {
        this.createConnection(targetPeerId);
      }, (oldPeerId) => {
        this.potentialPeers.delete(oldPeerId);
      }
    )
  }

  private createConnection(targetPeerId: string, outgoing = true) {
    if (
      this.blackList.has(targetPeerId) ||
      targetPeerId in this.connections ||
      this.peers.length >= this.maxNumberOfPeers ||
      (outgoing && this.peers.length >= this.maxNumberOfOutgoingConnections)
    ) return

    this.potentialPeers.add(targetPeerId);
    if (outgoing) {
      this.signaler.sendInvite(targetPeerId)
      this.logger.info("Send invite to:", targetPeerId);
    } else {
      this.logger.info("Received invite from:", targetPeerId);
    }
    this.connections[targetPeerId] = new PeerConnection(this.peerId, targetPeerId, this.logger, this.signaler, this.createOnClose(targetPeerId));
    this.connections[targetPeerId].onCompleteData = (data) => this.onCompleteData?.(data)
    this.connections[targetPeerId].onFileProgress = (data) => this.onFileProgress?.(data)
    // TODO: this number of callbacks scares me...
    this.connections[targetPeerId].onTyping = (data) => this.onTyping?.(data)
  }

  private createOnClose(targetPeerId: string) {
    return (block: boolean) => {
      delete this.connections[targetPeerId]
      if (block) {
        this.blackList.add(targetPeerId)
      }
    }
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

  sendText({peerId, data}: completeTextType) {
    this.connections[peerId].sendText(data)
  }

  async sendFile({peerId, file}: { peerId: string, file: File }) {
    await this.connections[peerId].sendFile(file)
  }

  emitTypingEvent() {
    for (const conn of Object.values(this.connections)) {
      conn.emitTypingEvent()
    }
  }

  cleanup() {

  }
}