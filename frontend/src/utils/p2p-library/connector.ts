import {Logger} from './logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signaling/firebase-signaler.ts";
import {connectionsType, messageDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";

export class Connector {
  private signaler: FirebaseSignaler;
  private connections: connectionsType = {}
  private onData: ({peerId, text}: messageDataType) => void
  private onMessage?: ({peerId, text}: messageDataType) => void
  private potentialPeers: Set<string> = new Set()

  constructor(
    private peerId: string,
    private logger: Logger,
  ) {
    this.onData = ({peerId, text}: messageDataType) => {
      this.onMessage?.({peerId, text})
    }

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
    this.connections[targetPeerId].setOnMessage(this.onData);
  }

  get peerIds() {
    return Object.keys(this.connections).filter((peerId) => this.connections[peerId].info.connected)
  }

  get peers() {
    return Object.entries(this.connections).map(([peerId, {info}]) => {
      return {peerId, info}
    })
  }

  get connectingPeersCount() {
    return Object.keys(this.connections).filter((peerId) => !this.connections[peerId].info.connected).length
  }

  get potentialPeersCount() {
    return this.potentialPeers.size
  }

  send({peerId, text}: messageDataType) {
    this.connections[peerId].send(text)
  }

  setOnMessage(onMessage: ({peerId, text}: messageDataType) => void) {
    this.onMessage = onMessage
  }

  cleanup() {

  }
}