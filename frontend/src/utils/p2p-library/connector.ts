import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";
import {Logger} from './logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signaling/firebase-signaler.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";

export class Connector {
  private signaler: FirebaseSignaler;
  private connections: { [peerId: string]: PeerConnection } = {}
  private onData: ({peerId, text}: messageDataType) => void

  constructor(
    private peerId: string,
    private logger: Logger,
    private onMessage: ({peerId, text}: messageDataType) => void
  ) {
    this.onData = ({peerId, text}: messageDataType) => {
      this.onMessage({peerId, text});
    }

    this.signaler = new FirebaseSignaler(peerId);
    this.init()
  }

  async init() {
    await this.signaler.registerPeer()
    this.logger.info("Registered peer:", this.peerId);

    this.signaler.onInvite((targetPeerId) => {
      if (targetPeerId in this.connections) return this.logger.info("Ignore invite from:", targetPeerId);
      this.logger.info("Received invite from:", targetPeerId);
      this.connections[targetPeerId] = new PeerConnection(this.signaler, this.logger, targetPeerId, this.peerId > targetPeerId, this.onData)
    })

    this.signaler.subscribeToNewPeers((targetPeer) => {
      this.logger.info("New peer detected:", targetPeer.peerId);
      if (targetPeer.peerId in this.connections) return

      this.connections[targetPeer.peerId] = new PeerConnection(this.signaler, this.logger, targetPeer.peerId, this.peerId > targetPeer.peerId, this.onData)
      this.signaler.sendInvite(targetPeer.peerId)
      this.logger.info("Send invite to:", targetPeer.peerId);
    })
  }

  get peers() {
    return Object.keys(this.connections)
  }

  send({peerId, text}: messageDataType) {
    this.connections[peerId].send(text)
  }
}