import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";
import {arrayBufferToBase64, generateNonce} from "@/utils/crypto/helpers.ts";
import {edKeyManager} from "@/init.ts";
import {ED25519PublicKeyManager} from "@/utils/crypto/ed25519KeyManager.ts";

export class SignatureMiddleware extends Middleware {
  private randomNonce = generateNonce()

  init() {
    this.logger.info("SignatureMiddleware initialized!");
    this.conn.send({data: arrayBufferToBase64(this.randomNonce), type: 'signature-request'});
  }

  call(data: messageDataType) {
    if (data.type === "signature-request") {
      this.logger.info("Signature request received: ", data.data);
      const signature = edKeyManager.sign(data.data);
      this.conn.send({data: arrayBufferToBase64(signature), type: 'signature-response'});
    } else if (data.type === "signature-response") {
      this.logger.info("Signature response received: ", data.data);
      const publicKeyManager = new ED25519PublicKeyManager(this.conn.targetPeerId)
      const verified = publicKeyManager.verify(data.data, '14321234')
      this.logger.error("Signature verification failed: ", verified)
    } else {
      return true
    }
    return false
  }
}