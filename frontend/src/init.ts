import {Connector} from "@/utils/p2p-library/connector.ts";
import {Logger} from "@/utils/logger.ts";
import {SecureStorage} from "@/utils/crypto/secureStorage.ts";
import {ED25519KeyPairManager, getPeerId,} from "@/utils/crypto/ed25519KeyManager.ts";
import {arrayBufferToBase64, generateNonce} from "@/utils/crypto/helpers.ts";

// const passphrase = prompt("Enter passphrase to encrypt your keys!");

let passphrase = localStorage.getItem('passphrase')
if (!passphrase) {
  passphrase = arrayBufferToBase64(generateNonce())
  localStorage.setItem('passphrase', passphrase)
}

// passphrase = arrayBufferToBase64(generateNonce())

const secureStorage = new SecureStorage(passphrase)

let peerKeys = null
try {
  peerKeys = await secureStorage.retrieveSecureData('peer-keys');
} catch (e) {
  // TODO: Ask user if he wants to create new key pair
  console.log('WRONG PASSPHRASE')
}

export const edKeyManager = peerKeys ? new ED25519KeyPairManager(peerKeys) : new ED25519KeyPairManager()

if (!peerKeys) {
  await secureStorage.storeSecureData('peer-keys', edKeyManager.exportKeyPair())
}

export const peerId = getPeerId(edKeyManager.publicKey.exportKey())
export const logger = new Logger();
export const connector = new Connector(peerId, logger)

connector.init()
