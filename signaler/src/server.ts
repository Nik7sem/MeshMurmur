import type {ClientMsg, ServerMsg} from "./types.ts";
import monitor from "../public/monitor.html"

const PORT = parseInt(process.env.PORT || "8001", 10)
const HOSTNAME = process.env.HOSTNAME || "127.0.0.1"
const NODE_ENV = process.env.NODE_ENV || "development"

interface PeerData {
  peerId: string;
}

function Payload(msg: ServerMsg) {
  return JSON.stringify(msg)
}

function Log(line: string) {
  server.publish("log", Payload({t: "monitor:new-log", log: line}));
  console.log(line)
}

type WebsocketType = Bun.ServerWebSocket<PeerData>
const Registry = new Map<string, WebsocketType>()

const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  development: NODE_ENV === "development",
  tls: NODE_ENV === "development" ? {
    cert: Bun.file('./certs/fullchain.pem'),
    key: Bun.file('./certs/server-key.pem'),
  } : undefined,
  routes: {
    "/monitor": monitor,
  },
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Upgrade failed", {status: 500}); // add html with peers connected
  },
  websocket: {
    maxPayloadLength: 1024,
    async open(ws: WebsocketType) {
      Log(`Open ${ws.remoteAddress}`);
      ws.subscribe("peer-change")
    },
    async close(ws: WebsocketType, code, message) {
      Log(`Close ${ws.remoteAddress}`);
      ws.unsubscribe("peer-change");
      if (ws.data && "peerId" in ws.data) {
        Registry.delete(ws.data.peerId)
        Log(`Exited peer: ${ws.data.peerId}`);
        ws.publish("peer-change", Payload({
          t: 'signal:peer-change',
          peer: {status: "disconnected", peerId: ws.data.peerId}
        }));
      }
    },
    async message(ws: WebsocketType, message) {
      if (typeof message !== "string") return

      let msg: ClientMsg;
      try {
        msg = JSON.parse(message);
      } catch (e) {
        ws.sendText(Payload({t: "error", reason: "bad_json"}));
        return
      }

      if (msg.t === "auth:init") {
        ws.data = {peerId: msg.peerId};
        Registry.set(ws.data.peerId, ws);

        ws.publish("peer-change", Payload({
          t: 'signal:peer-change',
          peer: {status: "connected", peerId: ws.data.peerId}
        }));

        Log(`Registered peer: ${ws.data.peerId}`);
      } else if (msg.t === "signal:invite") {
        Registry.get(msg.to)?.sendText(Payload({t: 'signal:invite', from: ws.data.peerId}));
        Log(`Invite from ${ws.data.peerId} to ${msg.to}`);
      } else if (msg.t === "signal:sdp") {
        Registry.get(msg.to)?.sendText(Payload({t: 'signal:sdp', from: ws.data.peerId, sdp: msg.sdp}))
        Log(`SDP from ${ws.data.peerId} to ${msg.to}`);
      } else if (msg.t === "signal:peer-list") {
        ws.sendText(Payload({
          t: 'signal:peer-list',
          peers: Array.from(Registry.keys())
        }))
        Log(`Peer-list from ${(ws.data && "peerId" in ws.data) ? ws.data.peerId : "unauthorized"}`);
      } else if (msg.t === "monitor:change-sub") {
        if (msg.subscription) {
          ws.subscribe("log")
        } else {
          ws.unsubscribe("log")
        }
      }
    }
  }
});

Log(`Server listening on "${server.url}" in "${NODE_ENV}" mode`);

