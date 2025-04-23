import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {Logger} from "@/utils/logger.ts";
import {ED25519KeyPairManager, getPeerId,} from "@/utils/crypto/ed25519KeyManager.ts";
import {arrayBufferToBase64, generateNonce} from "@/utils/crypto/helpers.ts";
import {askNotificationPermission} from "@/utils/notifications.ts";
import {SecureStorageManager} from "@/utils/p2p-library/secureStorageManager.ts";
import {initializeApp} from "firebase/app";
import {firebaseConfig} from "@/utils/p2p-library/conf.ts";
// init constants
export const AppVersion = 'Alpha v3.0.0'
askNotificationPermission()

// const passphrase = prompt("Enter passphrase to encrypt your keys!");
const anonymous = localStorage.getItem("anonymous")

let passphrase = localStorage.getItem('passphrase')
if (anonymous || !passphrase) {
  passphrase = arrayBufferToBase64(generateNonce())
  localStorage.setItem('passphrase', passphrase)
}

export const storageManager = new SecureStorageManager(passphrase)

const peerKeys = await storageManager.retrievePeerKeys()
if (!peerKeys) {
  // TODO: Ask user if he wants to create new key pair
  console.log('WRONG PASSPHRASE')
}

export const edKeyManager = peerKeys ? new ED25519KeyPairManager(peerKeys) : new ED25519KeyPairManager()

if (!peerKeys) {
  await storageManager.storePeerKeys(edKeyManager.exportKeyPair())
}

export const firebaseApp = initializeApp(firebaseConfig);

export const peerId = getPeerId(edKeyManager.publicKey.exportKey())
export const logger = new Logger();
export const connector = new Connector(peerId, logger)

await connector.init()

// init globals
window.DOCUMENT_VISIBLE = true
window.SCROLL_TO_BOTTOM = true

document.addEventListener('visibilitychange', () => {
  window.DOCUMENT_VISIBLE = !document.hidden
})

window.addEventListener('beforeunload', () => {
  connector.cleanup()
})

