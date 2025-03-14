import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";
import {arrayBufferToBase64, customEncodingToArrayBuffer, generateNonce} from "@/utils/crypto/helpers.ts";
import {edKeyManager} from "@/init.ts";
import {ED25519PublicKeyManager} from "@/utils/crypto/ed25519KeyManager.ts";

export class SignatureMiddleware extends Middleware {
  private randomNonce = generateNonce()
  private publicKeyManager = new ED25519PublicKeyManager(customEncodingToArrayBuffer(this.conn.targetPeerId))
  private timeout = 3000
  public verified = false

  init() {
    setTimeout(() => {
      if (!this.verified) {
        this.logger.warn("Signature verification failed!")
        this.conn.disconnect(true)
      }
    }, this.timeout)

    const sigRequest = arrayBufferToBase64(this.randomNonce)

    this.logger.info("Signature request sent: ", sigRequest);
    this.send({data: sigRequest, type: 'signature-request'});
  }

  call(data: messageDataType) {
    if (this.verified) return true

    if (data.type === "signature-request") {
      this.logger.info("Signature request received: ", data.data);

      const sig = edKeyManager.sign(data.data);
      const sigResponse = {sig: arrayBufferToBase64(sig), msg: data.data}

      this.logger.info("Signature response sent: ", sigResponse);
      this.send({data: sigResponse, type: 'signature-response'});
    } else if (data.type === "signature-response") {
      this.logger.info("Signature response received: ", data.data);

      this.verified = this.publicKeyManager.verify(data.data.sig, data.data.msg)
      if (this.verified) {
        this.logger.success("Signature verification succeeded!")
      } else {
        this.logger.error("Signature verification failed!")
      }
    } else {
      return this.verified
    }
    return false
  }

  isBlocked(): boolean {
    return !this.verified
  }
}