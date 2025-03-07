/**
 * chat.ts
 *
 * This example creates a decentralized chat node using js-libp2p with WebRTC transport.
 *
 * Key features:
 *   - Persistent identity: Instead of passing a PeerId, you supply a persistent private key.
 *     The node is created with options.privateKey, and the peer id is derived automatically.
 *     The private key is stored in localStorage (encrypted with a passphrase) so that your identity persists.
 *   - Transport: Uses only WebRTC (no WebSockets).
 *   - Stream Multiplexing: Uses Yamux (required so that multiple protocols share a single connection).
 *   - Connection Encryption: Uses Noise.
 *   - PubSub: Uses GossipSub (via gossipsub()) for group messaging.
 *   - Custom protocols:
 *       • Direct messages: '/myapp/chat/1.0.0'
 *       • History requests: '/myapp/chat/history/1.0.0'
 *
 * Note: If you need discovery, you can add a bootstrap module in peerDiscovery.
 */

import {createLibp2p} from 'libp2p'
import {webTransport} from '@libp2p/webtransport'
import {webRTC} from '@libp2p/webrtc'
import {yamux} from '@chainsafe/libp2p-yamux'
import {noise} from '@chainsafe/libp2p-noise'
import {circuitRelayTransport} from '@libp2p/circuit-relay-v2'
import {gossipsub, GossipsubEvents} from '@chainsafe/libp2p-gossipsub'
import {bootstrap} from '@libp2p/bootstrap'
import {generateKeyPair} from '@libp2p/crypto/keys'
import {identify, identifyPush} from '@libp2p/identify'
import {Libp2p} from 'libp2p'
import {PeerId, PubSub, Ed25519PrivateKey} from "@libp2p/interface"
import {fromString as uint8ArrayFromString} from 'uint8arrays/from-string'
import {toString as uint8ArrayToString} from 'uint8arrays/to-string'

type MyNode = Libp2p<{ pubsub: PubSub<GossipsubEvents> }>

// ---------------------- Helper Functions: ArrayBuffer ↔ Base64 ----------------------
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ---------------------- Web Crypto Functions for Encryption ----------------------
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16 // bytes
const IV_LENGTH = 12   // bytes

/**
 * Derives an AES-GCM CryptoKey from a passphrase and salt.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts plain text using AES-GCM.
 * Returns a string formatted as "salt:iv:ciphertext" (all Base64 encoded).
 */
async function encryptText(plainText: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plainText)
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(passphrase, salt)
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {name: 'AES-GCM', iv},
    key,
    data
  )
  return [
    arrayBufferToBase64(salt.buffer),
    arrayBufferToBase64(iv.buffer),
    arrayBufferToBase64(cipherBuffer)
  ].join(':')
}

/**
 * Decrypts an encrypted string produced by encryptText.
 */
async function decryptText(encryptedStr: string, passphrase: string): Promise<string> {
  const [saltB64, ivB64, cipherB64] = encryptedStr.split(':')
  const salt = new Uint8Array(base64ToArrayBuffer(saltB64))
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64))
  const cipherBuffer = base64ToArrayBuffer(cipherB64)
  const key = await deriveKey(passphrase, salt)
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {name: 'AES-GCM', iv},
    key,
    cipherBuffer
  )
  return new TextDecoder().decode(decryptedBuffer)
}

// ---------------------- Persistent Private Key Storage ----------------------
/**
 * Retrieves or creates a persistent private key for the node.
 * The private key (a Uint8Array) is stored encrypted in localStorage.
 * When passed to createLibp2p, the node will derive its peerId automatically.
 */
async function getOrCreatePrivateKey(passphrase: string): Promise<Ed25519PrivateKey> {
  // Generate a new Ed25519 key pair (returns a Uint8Array representing the private key)
  const privateKey = await generateKeyPair('Ed25519')
  console.log(`Created and stored new private key,${passphrase}`)
  return privateKey
}

// ---------------------- Global Variables & Protocols ----------------------
let messageHistory: Array<{ from: string; message: string }> = [] // Stores up to 50 messages
const CHAT_PROTOCOL = '/myapp/chat/1.0.0'           // Protocol for direct messaging
const HISTORY_PROTOCOL = '/myapp/chat/history/1.0.0'  // Protocol for history requests
const PUBSUB_TOPIC = 'myapp-chat-room'                // PubSub topic for group chat

// ---------------------- Create Libp2p Node ----------------------
/**
 * Creates and starts a libp2p node with the desired configuration.
 * We pass the persistent private key in options.privateKey.
 * The node will then derive its peerId automatically.
 */
async function createNode(passphrase: string): Promise<MyNode> {
  const privateKey = await getOrCreatePrivateKey(passphrase)

  const node = await createLibp2p({
    // Pass the persistent private key so that the node's identity is persistent.
    privateKey: privateKey,
    addresses: {
      // Listen on WebRTC addresses (and optionally circuit relay).
      listen: ['/p2p-circuit', '/webrtc']
    },
    transports: [
      // webTransport(),
      webRTC({
        rtcConfiguration: {
          iceServers: [
            {urls: 'stun:stun.l.google.com:19302'},
            {urls: 'stun:global.stun.twilio.com:3478'}
          ]
        }
      }),
      circuitRelayTransport(),
    ],
    // Use Yamux as the stream muxer (required by libp2p).
    streamMuxers: [yamux()],
    connectionEncrypters: [noise()],
    connectionGater: {
      denyDialMultiaddr: () => {
        // by default we refuse to dial local addresses from the browser since they
        // are usually sent by remote peers broadcasting undialable multiaddrs but
        // here we are explicitly connecting to a local node so do not deny dialing
        // any discovered address
        return false
      }
    },
    // Optional: add bootstrap peer discovery if desired.
    peerDiscovery: [
      bootstrap({
        list: [
          // '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmBootstrapPeer1',
          // '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmBootstrapPeer2',
          '/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
        ]
      })
    ],
    // Use GossipSub for pubsub messaging.
    services: {
      pubsub: gossipsub(),
      identify: identify(),
      identifyPush: identifyPush()
    }
  })

  await node.start()
  console.log(`Libp2p node started with id: ${node.peerId.toString()}`)

  // ---------------------- Protocol Handlers ----------------------
  // Handle direct chat messages.
  await node.handle(CHAT_PROTOCOL, async ({stream, connection}) => {
    let message = ''
    for await (const chunk of stream.source) {
      message += chunk.toString()
    }
    console.log(`Received direct message from ${connection.remotePeer.toString()}: ${message}`)
    messageHistory.push({from: connection.remotePeer.toString(), message})
    if (messageHistory.length > 50) {
      messageHistory = messageHistory.slice(-50)
    }
  })

  // Handle history requests: return the stored message history.
  await node.handle(HISTORY_PROTOCOL, async ({stream, connection}) => {
    const historyStr = JSON.stringify(messageHistory)
    await stream.sink([Buffer.from(historyStr)])
    console.log(`Sent history to ${connection.remotePeer.toString()}`)
  })

  // Listen for pubsub messages on the group chat topic.
  node.services.pubsub.addEventListener('message', (evt: CustomEvent) => {
    const {topic, data, from} = evt.detail
    if (topic === PUBSUB_TOPIC) {
      const message = uint8ArrayToString(data)
      console.log(`Received pubsub message on '${PUBSUB_TOPIC}' from ${from}: ${message}`)
      messageHistory.push({from, message})
      if (messageHistory.length > 50) {
        messageHistory = messageHistory.slice(-50)
      }
    }
  })

  // Debug multiaddresses and connections
  console.log('Initial multiaddresses:', node.getMultiaddrs().map(ma => ma.toString()));
  node.addEventListener('peer:discovery', (evt) => {
    console.log('Discovered peer:', evt.detail.id.toString(), evt.detail.multiaddrs.map(ma => ma.toString()));
  });
  node.addEventListener('connection:open', (evt) => {
    console.log('Connected to:', evt.detail.remotePeer.toString());
    console.log('Updated multiaddresses:', node.getMultiaddrs().map(ma => ma.toString()));
  });
  node.addEventListener('connection:close', (evt) => {
    console.log('Disconnected from:', evt.detail.remotePeer.toString());
  });

  return node
}

// ---------------------- Utility Functions ----------------------
/**
 * Returns a list of currently connected peer IDs.
 */
function listPeers(node: MyNode): PeerId[] {
  return node.getConnections().map(conn => conn.remotePeer)
}

/**
 * Sends a direct message to a specified peer using CHAT_PROTOCOL.
 */
async function sendDirectMessage(node: MyNode, peer: PeerId, message: string): Promise<void> {
  try {
    // dialProtocol accepts a PeerId
    const stream = await node.dialProtocol(peer, CHAT_PROTOCOL)
    await stream.sink([Buffer.from(message)])
    console.log(`Sent direct message to ${peer.toString()}: ${message}`)
    messageHistory.push({from: node.peerId.toString(), message})
    if (messageHistory.length > 50) {
      messageHistory = messageHistory.slice(-50)
    }
  } catch (err) {
    console.error('Error sending direct message:', err)
  }
}

/**
 * Broadcasts a message to all peers on the PUBSUB_TOPIC.
 */
async function broadcastMessage(node: MyNode, message: string): Promise<void> {
  await node.services.pubsub.publish(PUBSUB_TOPIC, uint8ArrayFromString(message))
  console.log(`Broadcasted message on '${PUBSUB_TOPIC}': ${message}`)
  messageHistory.push({from: node.peerId.toString(), message})
  if (messageHistory.length > 50) {
    messageHistory = messageHistory.slice(-50)
  }
}

/**
 * Requests message history from a specified peer.
 */
async function requestHistoryFromPeer(node: MyNode, peer: PeerId): Promise<Array<{ from: string; message: string }>> {
  try {
    const stream = await node.dialProtocol(peer, HISTORY_PROTOCOL)
    let historyData = ''
    for await (const chunk of stream.source) {
      historyData += chunk.toString()
    }
    const history = JSON.parse(historyData)
    console.log(`Received history from ${peer.toString()}:`, history)
    return history
  } catch (err) {
    console.error('Error requesting history:', err)
    return []
  }
}

// ---------------------- Main Entry Point ----------------------
/**
 * Main function to start the chat application.
 */
export async function testnode(): Promise<void> {
  // Prompt the user for a passphrase to secure the persistent private key.
  // const passphrase = prompt("Enter your passphrase for your identity key:") || ""
  const passphrase = ""
  const node = await createNode(passphrase)


  // Delay a few seconds to allow for peer discovery.
  setInterval(async () => {
    const peers = listPeers(node)
    console.log(node.getConnections())
    console.log('My multiaddresses:', node.getMultiaddrs())
    console.log(peers)
    // if (peers.length > 0) {
    //   await sendDirectMessage(node, peers[0], 'Hello, peer!')
    //   const history = await requestHistoryFromPeer(node, peers[0])
    //   console.log('Chat history from peer:', history)
    // }
    // await broadcastMessage(node, 'Hello everyone in the group chat!')
  }, 5000)
}