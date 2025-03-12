import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";
import {Logger} from './logger.ts'
import {FirebaseSignaler} from "@/utils/p2p-library/signaling/firebase-signaler.ts";
import {connectionsType, messageDataType} from "@/utils/p2p-library/types.ts";
import {parseRTCStats} from "@/utils/p2p-library/parseRTCStart.ts";

function createOnFinalState(targetPeerId: string, connections: connectionsType, logger: Logger) {
  return async (state: RTCPeerConnectionState | "timeout") => {
    if (state === "connected") {
      connections[targetPeerId].info.connected = true
      const stats = await connections[targetPeerId].pc.getStats()
      const {info} = parseRTCStats(stats)
      if (info) {
        logger.info(`Candidates info: `, info);
        logger.success(`Connection is using ${info.type} server.`);
        connections[targetPeerId].info.type = info.type
      }
      logger.success("Successfully connected to peer!")
    } else {
      connections[targetPeerId].pc.cleanup()
      delete connections[targetPeerId]
      logger.error(`Error in connection to peer: ${state}!`)
    }
  }
}

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
      this.addConnection(targetPeerId);
    })

    this.signaler.subscribeToPeers((targetPeer) => {
        this.logger.info("New peer detected:", targetPeer.peerId);
        if (targetPeer.peerId in this.connections) return

        this.potentialPeers.add(targetPeer.peerId);

        this.addConnection(targetPeer.peerId);
        this.signaler.sendInvite(targetPeer.peerId)
        this.logger.info("Send invite to:", targetPeer);
      }, (oldPeer) => {
        this.potentialPeers.delete(oldPeer.peerId);
      }
    )
  }

  private addConnection(targetPeerId: string) {
    const onFinalState = createOnFinalState(targetPeerId, this.connections, this.logger)
    this.connections[targetPeerId] = {
      pc: new PeerConnection(this.signaler, this.logger, targetPeerId, this.peerId > targetPeerId, this.onData, onFinalState),
      info: {
        connected: false,
        type: "",
      }
    }

    setTimeout(() => {
      if (!this.connections[targetPeerId].info.connected) {
        onFinalState("timeout")
      }
    }, 5000)
  }

  get peerIds() {
    return Object.keys(this.connections).filter((peerId) => this.connections[peerId].info.connected)
  }

  get peers() {
    return Object.entries(this.connections).map(([peerId, {pc, info}]) => {
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
    this.connections[peerId].pc.send(text)
  }

  setOnMessage(onMessage: ({peerId, text}: messageDataType) => void) {
    this.onMessage = onMessage
  }

  cleanup() {

  }
}