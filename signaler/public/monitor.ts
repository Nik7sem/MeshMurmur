import type {ClientMsg, ServerMsg} from "../src/types.ts";
import {updatePeerList, addLogLine} from "./ui.ts"

const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const host = location.host;
const ws = new WebSocket(`${protocol}//${host}/ws`);

function Payload(msg: ClientMsg) {
  return JSON.stringify(msg)
}

const PeerList = new Set<string>()

ws.onopen = () => {
  ws.send(Payload({t: "signal:peer-list"}))
  ws.send(Payload({t: "monitor:change-sub", subscription: true}))
  console.log("Connected!");
}

ws.onmessage = ({data}) => {
  console.log(data)
  let msg: ServerMsg;
  try {
    msg = JSON.parse(data);
  } catch (e) {
    console.error("Bad server json");
    return
  }

  if (msg.t === "signal:peer-list") {
    PeerList.clear()
    for (const peerId of msg.peers) {
      PeerList.add(peerId);
    }
    updatePeerList(PeerList)
  } else if (msg.t === "signal:peer-change") {
    if (msg.peer.status === "connected") {
      PeerList.add(msg.peer.peerId)
    } else {
      PeerList.delete(msg.peer.peerId)
    }
    updatePeerList(PeerList)
  } else if (msg.t === "monitor:new-log") {
    addLogLine(msg.log)
  } else {
    console.log(msg)
  }
}