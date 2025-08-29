import {Logger} from "@/utils/logger.ts";

interface NegotiationDescription {
  sessionId: string
}

export type NegotiationPackageType =
  | { 't': 'offer', description: NegotiationDescription }
  | { 't': 'answer', confirmed: boolean }

export class NegotiationManager {
  private _isNegotiated: boolean = false
  private description?: NegotiationDescription;
  private readonly _negotiationPromise: Promise<NegotiationDescription | undefined>
  private _negotiationResolve?: ((description?: NegotiationDescription) => void)
  public reconnect?: (np: NegotiationPackageType) => void

  constructor(
    private readonly polite: boolean,
    private readonly logger: Logger,
    private readonly sendNegotiationPackage: (np: NegotiationPackageType) => void,
  ) {
    this._negotiationPromise = new Promise((resolve) => {
      this._negotiationResolve = resolve
    })
  }

  static reject(sendNegotiationPackage: (np: NegotiationPackageType) => void) {
    sendNegotiationPackage({t: 'answer', confirmed: false})
  }

  startNegotiation(np?: NegotiationPackageType) {
    if (np) {
      if (np.t === 'offer') {
        this.handleOffer(np.description)
      }
    } else {
      this.sendNegotiationPackage({t: 'offer', description: this.createOffer()})
      this.logger.info('Sent offer.')
    }
  }

  createOffer() {
    this.description = {sessionId: window.crypto.randomUUID()}
    return this.description
  }

  handleOffer(description: NegotiationDescription) {
    if (this.polite || !this.description) {
      this.logger.info('Received offer.')
      this.description = description
      this.sendNegotiationPackage({t: 'answer', confirmed: true})
      this.logger.info('Sent answer.')
      this.onInitialize(this.description)
    } else {
      this.logger.info('Reject offer.')
    }
  }

  onNegotiationPackage(np: NegotiationPackageType) {
    if (this._isNegotiated) return this.reconnect?.(np)

    if (np.t === 'offer') {
      this.handleOffer(np.description)
    } else if (np.t === 'answer') {
      this.logger.info('Received answer.')
      if (np.confirmed) {
        this.onInitialize(this.description)
      } else {
        this.onInitialize()
      }
    }
  }

  get negotiation(): Promise<NegotiationDescription | undefined> {
    return this._negotiationPromise;
  }

  private onInitialize(description?: NegotiationDescription): void {
    if (this._isNegotiated) return

    this._isNegotiated = true
    this._negotiationResolve?.(description)
    if (description) {
      this.logger.info(description)
      this.logger.info("Peer connection has been confirmed.")
    } else {
      this.logger.info("Peer connection has been rejected.")
    }
  }
}