import {
  jsonDataType,
  byteDataType,
  dataChannelTransferType,
  ChannelEventHandlers, eventDataType
} from "@/utils/p2p-library/types.ts";
import {createChunk, parseChunk} from "@/utils/p2p-library/helpers.ts";

type rawJsonType = string
type rawByteType = ArrayBuffer

abstract class DataChannel<T extends (jsonDataType | byteDataType)> {
  public readonly channel: RTCDataChannel

  constructor(
    pc: RTCPeerConnection,
    public readonly channelType: dataChannelTransferType,
    handlers: ChannelEventHandlers
  ) {
    if (channelType === "reliable") {
      this.channel = this.createReliable(pc)
    } else if (channelType === "unordered") {
      this.channel = this.createUnordered(pc)
    } else if (channelType === "unreliable") {
      this.channel = this.createUnreliable(pc)
    } else {
      throw new Error(`Impossible channel type: ${channelType}`)
    }

    this.channel.onopen = () => handlers.onopen({channelType});
    this.channel.onmessage = (event) => handlers.ondata(this.processMessage(event.data))
    this.channel.onclose = () => handlers.onclose({channelType});
    this.channel.onerror = (error) => handlers.onerror({channelType, error: error});
  }

  send(data: T) {
    if (this.channel.readyState === "open") {
      this.__send(data)
    }
  }

  abstract __send(data: T): void

  abstract processMessage(data: rawByteType | rawJsonType): eventDataType

  private createReliable(pc: RTCPeerConnection): RTCDataChannel {
    const datachannel = pc.createDataChannel('reliable', {
      id: 1,
      negotiated: true,
      ordered: true,
      protocol: 'data',
    });

    datachannel.binaryType = 'arraybuffer'
    datachannel.bufferedAmountLowThreshold = 0;

    return datachannel
  }

  private createUnordered(pc: RTCPeerConnection): RTCDataChannel {
    const datachannel = pc.createDataChannel('unordered', {
      id: 2,
      negotiated: true,
      ordered: false,
      protocol: 'data',
    });

    datachannel.binaryType = 'arraybuffer'
    datachannel.bufferedAmountLowThreshold = 512 * 1024 * 8 // 512 Kb

    return datachannel
  }

  private createUnreliable(pc: RTCPeerConnection): RTCDataChannel {
    const datachannel = pc.createDataChannel('unreliable', {
      id: 3,
      negotiated: true,
      ordered: false,
      protocol: 'data',
      maxRetransmits: 0,
      // maxPacketLifeTime: 0,
    });

    datachannel.binaryType = 'arraybuffer'
    datachannel.bufferedAmountLowThreshold = 0;

    return datachannel
  }
}

class JsonChannel extends DataChannel<jsonDataType> {
  __send(data: jsonDataType) {
    this.channel.send(JSON.stringify(data));
  }

  processMessage(data: rawJsonType): eventDataType {
    const parsed = JSON.parse(data);
    return {
      channelType: this.channelType,
      datatype: 'json',
      type: parsed.type,
      data: parsed.data
    };
  }
}

class BinaryChannel extends DataChannel<byteDataType> {
  public readonly CHUNK_SIZE = 16 * 1024; // 16KB
  public readonly METADATA_SIZE = 100; // First 100 bytes for metadata

  __send(data: byteDataType) {
    this.channel.send(createChunk(data.data, data.metadata, this.CHUNK_SIZE, this.METADATA_SIZE));
  }

  processMessage(data: rawByteType): eventDataType {
    const parsed = parseChunk(data, this.CHUNK_SIZE, this.METADATA_SIZE)
    return {
      channelType: this.channelType,
      datatype: 'byte',
      metadata: parsed.metadata,
      data: parsed.payload
    };
  }
}

export class DataChannels {
  public readonly reliable: JsonChannel;
  public readonly unordered: BinaryChannel;
  public readonly unreliable: JsonChannel;

  constructor(
    pc: RTCPeerConnection,
    handlers: ChannelEventHandlers,
  ) {
    this.reliable = new JsonChannel(pc, 'reliable', handlers);
    this.unordered = new BinaryChannel(pc, 'unordered', handlers);
    this.unreliable = new JsonChannel(pc, 'unreliable', handlers);
  }
}