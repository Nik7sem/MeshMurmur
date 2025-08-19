import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {ConnectionData, PeerDataType} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/logger.ts";
import {TypedEventEmitter} from "@/utils/eventEmitter.ts";

type ClientMsg =
  | { t: "auth:init"; peerId: string }
  | { t: "auth:prove"; peerId: string; sig: string; challenge: string }
  | { t: "signal:sdp"; to: string; sdp: any }
  | { t: "signal:invite"; to: string }
  | { t: "signal:peer-list" };

type ServerMsg =
  | { t: "auth:challenge"; challenge: string }
  | { t: "auth:ok"; peerId: string }
  | { t: "auth:error"; reason: string }
  | { t: "signal:sdp"; from: string; sdp: any }
  | { t: "signal:invite"; from: string }
  | { t: "signal:peer-change"; peer: { status: "connected" | "disconnected", peerId: string } }
  | { t: "signal:peer-list"; peers: string[] }
  | { t: "error"; reason: string }


function Payload(msg: ClientMsg) {
  return JSON.stringify(msg)
}

type SDPChangeDataType = { connectionData: ConnectionData, from: string }

export class WebsocketSignaler extends Signaler {
  private ws: WebSocket;
  private eventEmitter = new TypedEventEmitter<{
    onInvite: string,
    addPeer: string,
    removePeer: string,
    updatePeerList: string[],
    onSDPChange: SDPChangeDataType,
  }>();
  private sdpCallbacks: { [key: string]: (data: SDPChangeDataType) => void } = {}
  private onOpen: () => void = () => undefined

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
      this.onOpen()
    }
    this.ws.onclose = () => {
      this.logger.info("Connection closed, try to reconnect in 3 seconds...")
      setTimeout(() => {
        this.ws = new WebSocket(this.url)
        this.connect()
      }, 3000)
    }
    this.ws.onmessage = ({data}) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(data);
      } catch (e) {
        this.logger.error("Bad server json");
        return
      }

      if (msg.t === "signal:peer-list") {
        this.eventEmitter.emit("updatePeerList", msg.peers.filter((peerId) => peerId !== this.peerId))
      } else if (msg.t === "signal:peer-change") {
        if (msg.peer.status === "connected") {
          this.eventEmitter.emit("addPeer", msg.peer.peerId)
        } else {
          this.eventEmitter.emit("removePeer", msg.peer.peerId)
        }
      } else if (msg.t === "signal:invite") {
        this.eventEmitter.emit("onInvite", msg.from)
      } else if (msg.t === "signal:sdp") {
        this.eventEmitter.emit("onSDPChange", {connectionData: msg.sdp, from: msg.from})
      }
    }
  }

  async registerPeer(peerData: PeerDataType) {
    const onOpen = () => {
      this.ws.send(Payload({t: "auth:init", peerId: this.peerId}))
      this.ws.send(Payload({t: "signal:peer-list"}))
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      onOpen()
    } else {
      this.onOpen = onOpen
    }
  }

  async setPeerData(peerData: PeerDataType) {

  }

  subscribeToPeers(
    addPeer: (peerId: string) => void,
    removePeer: (peerId: string) => void,
    updatePeerList: (peerIds: string[]) => void
  ) {
    this.eventEmitter.on("addPeer", addPeer)
    this.eventEmitter.on("removePeer", removePeer)
    this.eventEmitter.on("updatePeerList", updatePeerList)
  }

  unsubscribeFromNewPeers() {
    this.eventEmitter.offEvent("addPeer")
    this.eventEmitter.offEvent("removePeer")
  }

  async sendInvite(targetPeerId: string) {
    this.ws.send(Payload({t: "signal:invite", to: targetPeerId}))
  }

  async send(targetPeerId: string, connectionData: ConnectionData) {
    this.ws.send(Payload({t: "signal:sdp", to: targetPeerId, sdp: connectionData}))
  }

  onInvite(callback: (targetPeerId: string) => void) {
    this.eventEmitter.on("onInvite", callback)
  }

  on(targetPeerId: string, callback: (connectionData: ConnectionData) => void) {
    const onSDPChange = ({connectionData, from}: SDPChangeDataType) => {
      if (targetPeerId === from) {
        callback(connectionData)
      }
    }
    this.eventEmitter.on("onSDPChange", onSDPChange)
    this.sdpCallbacks[targetPeerId] = onSDPChange
  }

  off(targetPeerId: string) {
    this.eventEmitter.off("onSDPChange", this.sdpCallbacks[targetPeerId])
  }

  cleanup(targetPeerId: string) {

  }
}