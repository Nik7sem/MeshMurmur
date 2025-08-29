import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {ChannelEventBase, eventDataType} from "@/utils/p2p-library/types.ts";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  customEncodingToArrayBuffer,
  generateNonce
} from "@/utils/crypto/helpers.ts";
import {edKeyManager} from "@/init.ts";
import {ED25519PublicKeyManager} from "@/utils/crypto/ed25519KeyManager.ts";

export class SignatureMiddleware extends Middleware {
  private randomNonce = generateNonce()
  private publicKeyManager = new ED25519PublicKeyManager(customEncodingToArrayBuffer(this.targetPeerId))
  private resolveInit?: () => void
  private initPromise?: Promise<void>
  private disconnect?: () => void
  private blocked = false
  public verified = false

  async init(eventData: ChannelEventBase): Promise<void> {
    if (eventData.channelType === "reliable") {
      const sigRequest = arrayBufferToBase64(this.randomNonce)

      this.logger.info("Signature request sent: ", sigRequest);
      this.channel.reliable.send({data: sigRequest, type: 'signature-request'});
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

  blockPeer() {
    if (!this.verified) {
      this.logger.warn("Signature verification failed!")
      this.disconnect?.()
      this.blocked = true
    }
  }

  call(eventData: eventDataType) {
    if (this.verified) return true
    if (eventData.datatype !== 'json' || eventData.channelType !== 'reliable') return false

    if (eventData.type === "signature-request") {
      this.logger.info("Signature request received: ", eventData.data);

      const sigResponse = arrayBufferToBase64(edKeyManager.sign(base64ToArrayBuffer(eventData.data as string)))

      this.logger.info("Signature response sent: ", sigResponse);
      this.channel.reliable.send({data: sigResponse, type: 'signature-response'});
    } else if (eventData.type === "signature-response") {
      this.logger.info("Signature response received: ", eventData.data);

      this.verified = this.publicKeyManager.verify(eventData.data as string, this.randomNonce)
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