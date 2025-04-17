import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {Logger} from "@/utils/logger.ts";
import {ED25519KeyPairManager, getPeerId,} from "@/utils/crypto/ed25519KeyManager.ts";
import {arrayBufferToBase64, generateNonce} from "@/utils/crypto/helpers.ts";
import {askNotificationPermission} from "@/utils/notifications.ts";
import {SecureStorageManager} from "@/utils/p2p-library/secureStorageManager.ts";

// init globals
window.DOCUMENT_VISIBLE = true
window.SCROLL_TO_BOTTOM = true

document.addEventListener('visibilitychange', () => {
  window.DOCUMENT_VISIBLE = !document.hidden
})

// init constants

// const passphrase = prompt("Enter passphrase to encrypt your keys!");

export const AppVersion = 'Alpha v1.1.0'
askNotificationPermission()

let passphrase = localStorage.getItem('passphrase')
if (!passphrase) {
  passphrase = arrayBufferToBase64(generateNonce())
  localStorage.setItem('passphrase', passphrase)
}

// passphrase = arrayBufferToBase64(generateNonce())

const storageManager = new SecureStorageManager(passphrase)

const peerKeys = await storageManager.retrievePeerKeys()
if (!peerKeys) {
  // TODO: Ask user if he wants to create new key pair
  console.log('WRONG PASSPHRASE')
}

export const edKeyManager = peerKeys ? new ED25519KeyPairManager(peerKeys) : new ED25519KeyPairManager()

if (!peerKeys) {
  await storageManager.storePeerKeys(edKeyManager.exportKeyPair())
}

export const peerId = getPeerId(edKeyManager.publicKey.exportKey())
export const logger = new Logger();
export const connector = new Connector(peerId, logger)

await connector.init()
