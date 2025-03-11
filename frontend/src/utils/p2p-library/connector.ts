import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";
import {Logger} from './logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signaling/firebase-signaler.ts";
import {connectionsType, messageDataType} from "@/utils/p2p-library/types.ts";

const createOnFinalState = (targetPeerId: string, connections: connectionsType, logger: Logger) => {
  return (state: RTCPeerConnectionState | "timeout") => {
    logger.info(`FINAL STATE ${targetPeerId}: `, state)
    if (state === "connected") {
      connections[targetPeerId].connected = true
    } else {
      connections[targetPeerId].pc.cleanup()
      delete connections[targetPeerId]
    }
  }
}

export class Connector {
  private signaler: FirebaseSignaler;
  private connections: connectionsType = {}
  private onData: ({peerId, text}: messageDataType) => void
  private onMessage?: ({peerId, text}: messageDataType) => void
  public potentialPeersCount = 0

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

    this.signaler.onInvite((targetPeerId) => {
      if (targetPeerId in this.connections) return this.logger.info("Ignore invite from:", targetPeerId);
      this.logger.info("Received invite from:", targetPeerId);
      this.addConnection(targetPeerId);
    })

    this.signaler.subscribeToPeers((targetPeer) => {
        this.logger.info("New peer detected:", targetPeer);
        if (targetPeer.peerId in this.connections) return

        ++this.potentialPeersCount;

        this.addConnection(targetPeer.peerId);
        this.signaler.sendInvite(targetPeer.peerId)
        this.logger.info("Send invite to:", targetPeer);
      }, (oldPeer) => {
        --this.potentialPeersCount;
      }
    )
  }

  private addConnection(targetPeerId: string) {
    const onFinalState = createOnFinalState(targetPeerId, this.connections, this.logger)
    this.connections[targetPeerId] = {
      pc: new PeerConnection(this.signaler, this.logger, targetPeerId, this.peerId > targetPeerId, this.onData, onFinalState),
      connected: false
    }
    // TODO: add reconnection attempt if failed (and understand why failing)
    setTimeout(() => {
      if (!this.connections[targetPeerId].connected) {
        onFinalState("timeout")
      }
    }, 2000)
  }

  get peers() {
    return Object.keys(this.connections).filter((peerId) => this.connections[peerId].connected)
  }

  get connectingPeersCount() {
    return Object.keys(this.connections).filter((peerId) => !this.connections[peerId].connected).length
  }

  send({peerId, text}: messageDataType) {
    this.connections[peerId].pc.send(text)
  }

  setOnMessage(onMessage: ({peerId, text}: messageDataType) => void) {
    this.onMessage = onMessage
  }

  cleanup() {
    this.signaler.cleanup()
  }
}