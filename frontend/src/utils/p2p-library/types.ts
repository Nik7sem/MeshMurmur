export type PeerDataType = { ready: boolean };

export type logType = { text: string, type: "success" | "info" | "warn" | "error" }

type SDP = RTCSessionDescriptionInit;
type ICE = RTCIceCandidateInit;
export type ConnectionData = { description?: SDP, candidate?: ICE };

type byteData = ArrayBuffer | Blob | ArrayBufferView
export type rawMessageDataType = string | byteData
export type objectMessageDataType = { data: any, type: string }
export type parsedMessageDataType = objectMessageDataType | byteData

export type completeTextType = { peerId: string, data: string }
export type completeFileType = {
  peerId: string
  data: {
    url: string
    fileName: string
    fileSize: number
    fileType: string
  }
}

export type completeMessageType = completeTextType | completeFileType

