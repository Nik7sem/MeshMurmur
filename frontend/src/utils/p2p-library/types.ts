export type PeerType = { peerId: string, data: { ready: boolean } };
export type logType = { text: string, type: "info" | "warn" | "error" }
type SDP = RTCSessionDescriptionInit;
type ICE = RTCIceCandidateInit;
export type ConnectionData = { description?: SDP, candidate?: ICE };