import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";
import {arrayBufferToBase64, customEncodingToArrayBuffer, generateNonce} from "@/utils/crypto/helpers.ts";
import {edKeyManager} from "@/init.ts";
import {ED25519PublicKeyManager} from "@/utils/crypto/ed25519KeyManager.ts";

export class SignatureMiddleware extends Middleware {
  private randomNonce = generateNonce()
  private publicKeyManager = new ED25519PublicKeyManager(customEncodingToArrayBuffer(this.conn.targetPeerId))

  init() {
    this.logger.info("SignatureMiddleware initialized!");
    this.conn.send({data: arrayBufferToBase64(this.randomNonce), type: 'signature-request'});
  }

  call(data: messageDataType) {
    if (data.type === "signature-request") {
      this.logger.info("Signature request received: ", data.data);
      const sig = edKeyManager.sign(data.data);
      console.log({sig: arrayBufferToBase64(sig), msg: data.data})
      this.conn.send({data: {sig: arrayBufferToBase64(sig), msg: data.data}, type: 'signature-response'});
    } else if (data.type === "signature-response") {
      this.logger.info("Signature response received: ", data.data);

      const verified = this.publicKeyManager.verify(data.data.sig, data.data.msg)
      if (verified) {
        this.logger.success("Signature verification succeeded!")
      } else {
        this.logger.error("Signature verification failed!")
      }
    } else {
      return true
    }
    return false
  }
}