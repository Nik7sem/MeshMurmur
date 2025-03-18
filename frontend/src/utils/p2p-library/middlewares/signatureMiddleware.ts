import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {parsedMessageDataType} from "@/utils/p2p-library/types.ts";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  customEncodingToArrayBuffer,
  generateNonce
} from "@/utils/crypto/helpers.ts";
import {edKeyManager} from "@/init.ts";
import {ED25519PublicKeyManager} from "@/utils/crypto/ed25519KeyManager.ts";
import {isObjectMessage} from "@/utils/p2p-library/isObjectHelper.ts";

export class SignatureMiddleware extends Middleware {
  private randomNonce = generateNonce()
  private publicKeyManager = new ED25519PublicKeyManager(customEncodingToArrayBuffer(this.conn.targetPeerId))
  private timeout = 3000
  private timeoutId = 0
  public verified = false

  init() {
    this.timeoutId = Number(setTimeout(() => this.blockPeer(), this.timeout))
    const sigRequest = arrayBufferToBase64(this.randomNonce)

    this.logger.info("Signature request sent: ", sigRequest);
    this.send({data: sigRequest, type: 'signature-request'});
  }

  blockPeer() {
    if (!this.verified) {
      clearInterval(this.timeoutId);
      this.logger.warn("Signature verification failed!")
      this.conn.disconnect(true)
    }
  }

  call(data: parsedMessageDataType) {
    if (this.verified) return true
    if (!isObjectMessage(data)) return false

    if (data.type === "signature-request") {
      this.logger.info("Signature request received: ", data.data);

      const sigResponse = arrayBufferToBase64(edKeyManager.sign(base64ToArrayBuffer(data.data)))

      this.logger.info("Signature response sent: ", sigResponse);
      this.send({data: sigResponse, type: 'signature-response'});
    } else if (data.type === "signature-response") {
      this.logger.info("Signature response received: ", data.data);

      this.verified = this.publicKeyManager.verify(data.data, this.randomNonce)
      if (this.verified) {
        this.logger.success("Signature verification succeeded!")
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