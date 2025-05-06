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
  private publicKeyManager = new ED25519PublicKeyManager(customEncodingToArrayBuffer(this.conn.targetPeerId))
  private timeout = 4000
  private timeoutId = 0
  private resolveInit: null | (() => void) = null
  private initPromise: null | Promise<void> = null
  public verified = false

  async init(eventData: ChannelEventBase): Promise<void> {
    if (eventData.channelType === "reliable") {
      this.timeoutId = Number(setTimeout(() => this.blockPeer(), this.timeout))
      const sigRequest = arrayBufferToBase64(this.randomNonce)

      this.logger.info("Signature request sent: ", sigRequest);
      this.conn.channel.reliable.send({data: sigRequest, type: 'signature-request'});
    }
    if (!this.initPromise) {
      this.initPromise = new Promise(resolve => this.resolveInit = resolve)
    }

    return this.initPromise
  }

  blockPeer() {
    if (!this.verified) {
      clearInterval(this.timeoutId);
      this.logger.warn("Signature verification failed!")
      this.conn.disconnect(true)
    }
  }

  call(eventData: eventDataType) {
    if (this.verified) return true
    if (eventData.datatype !== 'json' || eventData.channelType !== 'reliable') return false

    if (eventData.type === "signature-request") {
      this.logger.info("Signature request received: ", eventData.data);

      const sigResponse = arrayBufferToBase64(edKeyManager.sign(base64ToArrayBuffer(eventData.data as string)))

      this.logger.info("Signature response sent: ", sigResponse);
      this.conn.channel.reliable.send({data: sigResponse, type: 'signature-response'});
    } else if (eventData.type === "signature-response") {
      this.logger.info("Signature response received: ", eventData.data);

      this.verified = this.publicKeyManager.verify(eventData.data as string, this.randomNonce)
      if (this.verified) {
        if (this.resolveInit) {
          this.resolveInit()
        } else {
          console.error('Signature verification succeeded before initialization!')
        }
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