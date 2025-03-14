import {Logger} from '../logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signalers/firebase-signaler.ts";
import {messagePeerDataType, textDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";
import {getRandomSample} from "@/utils/getRandomSample.ts";

export class Connector {
  private signaler: FirebaseSignaler;
  private connections: { [peerId: string]: PeerConnection } = {}
  private blackList: Set<string> = new Set()
  private onData?: (data: messagePeerDataType) => void
  private potentialPeers: Set<string> = new Set()
  private maxNumberOfPeers = 3

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

  private createConnection(targetPeerId: string, sendInvite = true) {
    if (this.blackList.has(targetPeerId) || targetPeerId in this.connections || this.peers.length >= this.maxNumberOfPeers) return

    this.potentialPeers.add(targetPeerId);
    if (sendInvite) {
      this.signaler.sendInvite(targetPeerId)
      this.logger.info("Send invite to:", targetPeerId);
    } else {
      this.logger.info("Received invite from:", targetPeerId);
    }
    this.connections[targetPeerId] = new PeerConnection(this.peerId, targetPeerId, this.logger, this.signaler, this.createOnClose(targetPeerId));
    this.connections[targetPeerId].setOnData((data) => this.onData?.(data));
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