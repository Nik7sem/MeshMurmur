import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {ConnectionData, PeerDataType} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/logger.ts";

export class WebsocketSignaler extends Signaler {
  private ws: WebSocket;

  constructor(
    private readonly peerId: string,
    private logger: Logger,
    private readonly url = "wss://localhost:8001",
  ) {
    super()
    this.ws = new WebSocket(url)
    this.connect()
  }

  connect() {
    this.ws.onopen = () => {
      this.logger.info("Connection opened")
      this.ws.send(this.peerId)
    }
    this.ws.onclose = () => {
      this.logger.info("Connection closed, try to reconnect in 3 seconds...")
      setTimeout(() => {
        this.ws = new WebSocket(this.url)
        this.connect()
      }, 3000)
    }
  }

  async registerPeer(peerData: PeerDataType) {

  }

  async setPeerData(peerData: PeerDataType) {

  }

  async getAvailablePeers() {
    return new Array<string>
  }

  subscribeToPeers(addNewPeer: (peerId: string) => void, removeOldPeer: (peerId: string) => void) {

  }

  unsubscribeFromNewPeers() {

  }

  async sendInvite(targetPeerId: string) {

  }

  async send(targetPeerId: string, connectionData: ConnectionData) {

  }

  onInvite(callback: (targetPeerId: string) => void) {

  }

  on(targetPeerId: string, callback: (connectionData: ConnectionData) => void) {

  }

  off(targetPeerId: string) {

  }

  cleanup(targetPeerId: string) {
    this.ws.close();
  }
}