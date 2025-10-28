import {Middleware} from "@p2p-library/abstract.ts";
import {ChannelEventBase, eventDataType} from "@p2p-library/types.ts";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  customEncodingToArrayBuffer,
  generateNonce
} from "@p2p-library/crypto/helpers.ts";
import {ED25519PublicKeyManager} from "@p2p-library/crypto/ed25519KeyManager.ts";

export class SignatureMiddleware extends Middleware {
  static name = "SignatureMiddleware"
  private localChallenge = arrayBufferToBase64(generateNonce())
  private remoteChallenge?: string
  private resolveInit?: () => void
  private initPromise?: Promise<void>
  private disconnect?: () => void
  private blocked = false
  private sign?: (msg: string) => string
  public verified = false

  async init(eventData: ChannelEventBase): Promise<void> {
    if (eventData.channelType === "reliable") {
      this.channel.reliable.send({data: this.localChallenge, type: 'signature-challenge'});
      this.logger.info("Challenge sent: ", this.localChallenge);
    }
    if (!this.initPromise) {
      this.initPromise = new Promise(resolve => this.resolveInit = resolve)
    }

    return this.initPromise
  }

  protected requiresInit(): boolean {
    return true
  }

  setDisconnect(disconnect: () => void): void {
    if (this.disconnect) return
    this.disconnect = disconnect
    if (this.blocked) {
      this.disconnect()
    }
  }

  private blockPeer() {
    this.logger.warn("Signature verification failed!")
    this.disconnect?.()
    this.blocked = true
  }

  setSign(sign: (msg: string) => string) {
    if (this.sign) return
    this.sign = sign
    this.sendProve()
  }

  private sendProve() {
    if (!this.sign || !this.remoteChallenge) return
    const prove = this.sign(this.remoteChallenge)
    this.channel.reliable.send({data: prove, type: 'signature-prove'});
    this.logger.info("Prove sent: ", prove);
  }

  call(eventData: eventDataType) {
    if (this.verified) return true
    if (eventData.datatype !== 'json' || eventData.channelType !== 'reliable') return false

    if (eventData.type === "signature-challenge") {
      this.remoteChallenge = eventData.data as string
      this.logger.info("Challenge received: ", this.remoteChallenge);
      this.sendProve()
    } else if (eventData.type === "signature-prove") {
      const prove = eventData.data as string
      this.logger.info("Prove received: ", prove);
      const pb = new ED25519PublicKeyManager(customEncodingToArrayBuffer(this.targetPeerId))
      this.verified = pb.verify(prove, base64ToArrayBuffer(this.localChallenge))
      if (this.verified) {
        if (this.resolveInit) {
          this.resolveInit()
        } else {
          console.error('Signature verification succeeded before initialization!')
        }
        this.onInitialize()
        this.logger.info("Signature verification succeeded!")
      } else {
        this.blockPeer()
      }
    } else {
      return this.verified
    }
    return false
  }

  isBlocked() {
    return !this.verified
  }
}