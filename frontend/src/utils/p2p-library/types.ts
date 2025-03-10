export type PeerType = { peerId: string, data: { ready: boolean } };
type SDP = RTCSessionDescriptionInit;
type ICE = RTCIceCandidateInit;
export type ConnectionData = { description?: SDP, candidate?: ICE };