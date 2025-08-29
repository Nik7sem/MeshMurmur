import {ChannelEventBase, ConnectionData, eventDataType, PeerDataType} from "@/utils/p2p-library/types.ts";
import {Logger} from "../logger.ts";
import {NegotiationPackageType} from "@/utils/p2p-library/connection/negotiationManager.ts";
import {DataChannels} from "@/utils/p2p-library/connection/DataChannel.ts";

export abstract class BasicSignaler {
  abstract send(targetPeerId: string, connectionData: ConnectionData): void

  abstract on(targetPeerId: string, callback: (connectionData: ConnectionData) => void): void

  abstract off(targetPeerId: string): void
}

export abstract class Signaler extends BasicSignaler {
  public onNegotiationPackage?: (peerId: string, np: NegotiationPackageType) => void
  public onAddedPeer?: (peerId: string) => void
  public onRemovedPeer?: (peerId: string) => void
  public onPeerList?: (peerIds: string[]) => void

  protected sdpCallbacks: { [key: string]: (connectionData: ConnectionData) => void } = {}
  protected sdpCache: { [key: string]: ConnectionData[] } = {}

  protected constructor(
    protected readonly logger: Logger,
  ) {
    super()
  }

  abstract info(): string;

  abstract registerPeer(peerData: PeerDataType): void

  abstract sendNegotiationPackage(targetPeerId: string, np: NegotiationPackageType): void

  abstract setPeerData(peerData: PeerDataType): void

  on(targetPeerId: string, callback: (connectionData: ConnectionData) => void) {
    this.sdpCallbacks[targetPeerId] = callback
    if (targetPeerId in this.sdpCache && this.sdpCache[targetPeerId].length > 0) {
      this.logger.warn("Cached SDP used!")
      for (const connectionData of this.sdpCache[targetPeerId]) {
        callback(connectionData)
      }
      delete this.sdpCache[targetPeerId]
    }
  }

  off(targetPeerId: string) {
    if (targetPeerId in this.sdpCache) delete this.sdpCache[targetPeerId]
    if (targetPeerId in this.sdpCallbacks) delete this.sdpCallbacks[targetPeerId]
  }

  onSDP(sdp: ConnectionData, from: string) {
    if (from in this.sdpCallbacks) {
      this.sdpCallbacks[from](sdp)
    } else {
      if (!(from in this.sdpCallbacks)) {
        this.sdpCache[from] = []
      }
      this.sdpCache[from].push(sdp)
    }
  }
}

export abstract class Middleware {
  private _isInitialized: boolean = false
  private readonly _initPromise: Promise<void>
  private _initResolve?: (() => void)

  constructor(
    protected peerId: string,
    protected targetPeerId: string,
    protected channel: DataChannels,
    protected logger: Logger,
  ) {
    if (!this.requiresInit()) {
      this._isInitialized = true
      this._initPromise = Promise.resolve()
    } else {
      this._initPromise = new Promise((resolve) => {
        this._initResolve = resolve
      })
    }
  }

  protected requiresInit(): boolean {
    return false
  }

  protected onInitialize(): void {
    if (this._isInitialized) return

    this._isInitialized = true
    this._initResolve?.()
    this.logger.info("Initialized!")
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get initialization(): Promise<void> {
    return this._initPromise
  }

  // on datachannel open
  async init(eventData: ChannelEventBase) {
  }

  // call middleware on new message
  call(eventData: eventDataType): boolean {
    return true
  }

  isBlocked(): boolean {
    return false
  }
}