import {PeerConnection} from "@/utils/p2p-library/peerConnection.ts";

export type PeerDataType = { ready: boolean };
export type PeerType = { peerId: string, data: PeerDataType };
export type logType = { text: string, type: "success" | "info" | "warn" | "error" }
type SDP = RTCSessionDescriptionInit;
type ICE = RTCIceCandidateInit;
export type ConnectionData = { description?: SDP, candidate?: ICE };
export type messageDataType = { peerId: string, text: string }
export type connectionsType = {
  [peerId: string]: { pc: PeerConnection, info: { connected: boolean, type: "STUN" | "TURN" | "" } }
}