import {Connector} from "@p2p-library/connection/connector.ts";
import {MainLogger} from "@p2p-library/logger.ts";
import {ED25519KeyPairManager, getPeerId,} from "@p2p-library/crypto/ed25519KeyManager.ts";
import {arrayBufferToBase64, generateNonce} from "@p2p-library/crypto/helpers.ts";
import {askNotificationPermission} from "@/utils/notifications.ts";
import {SecureStorageManager} from "@p2p-library/secureStorageManager.ts";
import {getDefaultUserData} from "@/defaultContext/getDefaultUserData.ts";
import {RTCConfigHelper} from "@p2p-library/RTCConfigHelper.ts";
// init constants
export const AppVersion = 'Alpha v7.2.2'
export const urlRegex = /^https:\/\/\S+$/i;
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

const stringConfigFromStorage = await storageManager.retrieveRTCConfig()
let configFromStorage: object | undefined
if (stringConfigFromStorage) {
  try {
    configFromStorage = JSON.parse(stringConfigFromStorage)
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.log("broken config from storage")
    }
  }
}

export const MainRTCConfig = new RTCConfigHelper(storageManager, configFromStorage)

const defaultUserData = await getDefaultUserData()

export const peerId = getPeerId(edKeyManager.publicKey.exportKey())
export const logger = new MainLogger();
export const connector = new Connector(peerId, defaultUserData.connectorConfig, MainRTCConfig, logger, edKeyManager)

connector.actions.sendNickname(defaultUserData.nickname)
connector.actions.associatedNicknames = defaultUserData.associatedNicknames

await connector.init()

// init globals
window.DOCUMENT_VISIBLE = true
window.SCROLL_TO_BOTTOM = true

// listeners
document.addEventListener('visibilitychange', () => {
  window.DOCUMENT_VISIBLE = !document.hidden
})

window.addEventListener('beforeunload', (event) => {
  if (location.hostname !== 'siegfriedschmidt.github.io') return
  event.preventDefault()
  // connector.cleanup()
})
