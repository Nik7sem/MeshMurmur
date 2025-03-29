export type PeerDataType = { ready: boolean };

export type logType = { text: string, type: "success" | "info" | "warn" | "error" }

type SDP = RTCSessionDescriptionInit;
type ICE = RTCIceCandidateInit;
export type ConnectionData = { description?: SDP, candidate?: ICE };

export type dataChannelTransferType = 'reliable' | 'unordered' | 'unreliable';

export interface ChannelEventBase {
  channelType: dataChannelTransferType
}

export type eventDataType =
  ChannelEventBase & { datatype: 'json' } & jsonDataType |
  ChannelEventBase & { datatype: 'byte' } & byteDataType

export type ChannelEventHandlers = {
  onopen: (event: ChannelEventBase) => void;
  ondata: (event: eventDataType) => void;
  onclose: (event: ChannelEventBase) => void;
  onerror: (event: ChannelEventBase & { error: RTCErrorEvent }) => void;
};


export type jsonDataType = { data: unknown, type: string }
export type byteDataType = { data: ArrayBuffer, metadata: unknown }

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

export type fileProgressType = { title: string, progress: number, bitrate: number }
export type onFileProgressType = (data: fileProgressType) => void

