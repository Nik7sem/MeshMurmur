export type ClientMsg =
  | { t: "auth:init"; peerId: string }
  | { t: "auth:prove"; peerId: string; sig: string; challenge: string }
  | { t: "signal:sdp"; to: string; sdp: any }
  | { t: "signal:negotiation"; to: string; np: any }
  | { t: "signal:peer-list" }
  | { t: "monitor:change-sub"; subscription: boolean };

export type ServerMsg =
  | { t: "auth:challenge"; challenge: string }
  | { t: "auth:ok"; peerId: string }
  | { t: "auth:error"; reason: string }
  | { t: "signal:sdp"; from: string; sdp: any }
  | { t: "signal:negotiation"; from: string; np: any }
  | { t: "signal:peer-change"; peer: { status: "connected" | "disconnected", peerId: string } }
  | { t: "signal:peer-list"; peers: string[] }
  | { t: "monitor:new-log"; log: string }
  | { t: "error"; reason: string }

