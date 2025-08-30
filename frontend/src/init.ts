import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {MainLogger} from "@/utils/logger.ts";
import {ED25519KeyPairManager, getPeerId,} from "@/utils/crypto/ed25519KeyManager.ts";
import {arrayBufferToBase64, generateNonce} from "@/utils/crypto/helpers.ts";
import {askNotificationPermission} from "@/utils/notifications.ts";
import {SecureStorageManager} from "@/utils/p2p-library/secureStorageManager.ts";
import {getDefaultUserData} from "@/defaultContext/getDefaultUserData.ts";
// init constants
export const AppVersion = 'Alpha v5.61'
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

const defaultUserData = await getDefaultUserData()

export const peerId = getPeerId(edKeyManager.publicKey.exportKey())
export const logger = new MainLogger();
export const connector = new Connector(peerId, defaultUserData.connectorConfig, logger)

connector.actions.sendNickname(defaultUserData.nickname)
connector.actions.associatedNicknames = defaultUserData.associatedNicknames

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

