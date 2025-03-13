import {Connector} from "@/utils/p2p-library/connector.ts";
import {Logger} from "@/utils/p2p-library/logger.ts";
import {SecureStorage} from "@/utils/crypto/SecureStorage.ts";
import {ED25519KeyPairManager} from "@/utils/crypto/ED25519KeyManager.ts";
import {arrayBufferToBase64, base64ToArrayBuffer, generateNonce} from "@/utils/crypto/helpers.ts";

// const passphrase = prompt("Enter passphrase to encrypt your keys!");

let passphrase = localStorage.getItem('passphrase')
if (!passphrase) {
  passphrase = arrayBufferToBase64(generateNonce())
  localStorage.setItem('passphrase', passphrase)
}

const secureStorage = new SecureStorage(passphrase)

let peerKeys = null
try {
  peerKeys = await secureStorage.retrieveSecureData('peer-keys');
} catch (e) {
  console.log('WRONG PASSPHRASE')
}

const edKeyManager = peerKeys ? new ED25519KeyPairManager(peerKeys) : new ED25519KeyPairManager()

if (!peerKeys) {
  await secureStorage.storeSecureData('peer-keys', edKeyManager.exportKeyPair())
}

export const peerId = edKeyManager.getPublicKey()

export const logger = new Logger();
export const connector = new Connector(peerId, logger)

connector.init()
