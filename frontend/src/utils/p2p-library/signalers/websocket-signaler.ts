import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {ConnectionData, PeerDataType} from "@/utils/p2p-library/types.ts";
import {Logger} from "@/utils/logger.ts";

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

interface WebsocketConfig {
  url: string;
}

export interface WebsocketSignalerInterface {
  type: 'websocket';
  config: WebsocketConfig;
}

function Payload(msg: ClientMsg) {
  return JSON.stringify(msg)
}

export class WebsocketSignaler extends Signaler {
  private reconnectionAttempt = 0;
  private readonly reconnectTimout = 100

  private ws!: WebSocket;
  private onOpen: () => void = () => undefined

  constructor(
    private readonly peerId: string,
    private readonly config: WebsocketConfig,
    logger: Logger
  ) {
    super(logger);
    this.connect()
  }

  info() {
    return `WebsocketSignaler (${this.config.url})`
  }

  connect() {
    this.ws = new WebSocket(this.config.url)
    this.ws.onopen = () => {
      this.logger.info("Connection opened")
      this.reconnectionAttempt = 0
      this.onOpen()
    }

    this.ws.onclose = () => {
      const currentReconnectTimout = this.reconnectTimout * 5 ** this.reconnectionAttempt++
      this.logger.info(`Connection closed, try to reconnect in ${currentReconnectTimout} ms...`)
      setTimeout(() => this.connect(), currentReconnectTimout)
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
        this.onPeerList?.(msg.peers.filter((peerId) => peerId !== this.peerId))
      } else if (msg.t === "signal:peer-change") {
        if (msg.peer.status === "connected") {
          this.logger.info(`Added peer: ${msg.peer.peerId}`);
          this.onAddedPeer?.(msg.peer.peerId)
        } else {
          this.logger.info(`Removed peer: ${msg.peer.peerId}`);
          this.onRemovedPeer?.(msg.peer.peerId)
        }
      } else if (msg.t === "signal:invite") {
        this.logger.info(`Received invite from: ${msg.from}`);
        this.onInvite?.(msg.from)
      } else if (msg.t === "signal:sdp") {
        this.onSDP(msg.sdp, msg.from)
      }
    }
  }

  registerPeer(peerData: PeerDataType) {
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

  setPeerData(peerData: PeerDataType) {

  }

  sendInvite(targetPeerId: string) {
    this.logger.info("Sent invite to:", targetPeerId);
    this.ws.send(Payload({t: "signal:invite", to: targetPeerId}))
  }

  send(targetPeerId: string, connectionData: ConnectionData) {
    this.ws.send(Payload({t: "signal:sdp", to: targetPeerId, sdp: connectionData}))
  }
}