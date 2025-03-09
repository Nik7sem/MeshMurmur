import {gossipsub, GossipsubEvents} from '@chainsafe/libp2p-gossipsub'
import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import {circuitRelayTransport} from '@libp2p/circuit-relay-v2'
import {createLibp2p, Libp2p} from 'libp2p'
import {multiaddr, protocols, Multiaddr} from '@multiformats/multiaddr'
import {identify, identifyPush} from '@libp2p/identify'
import {PubSub, Stream} from "@libp2p/interface"
import {pubsubPeerDiscovery} from '@libp2p/pubsub-peer-discovery'
import {webRTC} from '@libp2p/webrtc'
import {webSockets} from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import {dcutr} from '@libp2p/dcutr'
import {bootstrap} from "@libp2p/bootstrap";
import {byteStream, ByteStream} from 'it-byte-stream'
import {fromString, toString} from 'uint8arrays'

// type Node = Libp2p<{ pubsub: PubSub<GossipsubEvents> }>
// let chatStream: ByteStream<Stream> | null = null;
const CHAT_PROTOCOL = '/libp2p/examples/chat/1.0.0'
export const TOPIC = 'LOLOLOLOL'
const PUBSUB_PEER_DISCOVERY = "browser-peer-discovery"
const WEBRTC_CODE = protocols('webrtc').code
let ma: Multiaddr
let chatStream: ByteStream

export const node = await createNode()

async function createNode() {
  // setInterval(() => {
  //   console.log(getMultiaddrList())
  // }, 5000)

  return await createLibp2p({
    addresses: {
      listen: [
        '/p2p-circuit',
        '/webrtc'
      ]
    },
    transports: [
      webSockets({
        // this allows non-secure WebSocket connections for purposes of the demo
        // filter: filters.all
      }),
      webRTC(),
      circuitRelayTransport()
    ],
    peerDiscovery: [
      bootstrap({
        list: [
          '/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
          '/ip4/127.0.0.1/tcp/56565/ws/p2p/12D3KooWHYkerwrNzWcSQrkZ6uzoKURAeHXvRrMwjndAGE588gRP'
        ]
      }),
      pubsubPeerDiscovery({
        interval: 10_000,
        topics: [PUBSUB_PEER_DISCOVERY],
      })
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionGater: {
      // denyDialMultiaddr: () => {
      //   return false
      // }
    },
    services: {
      identify: identify(),
      identifyPush: identifyPush(),
      pubsub: gossipsub(),
      // dcutr: dcutr()
    },
    connectionManager: {
      maxConnections: 10,
    }
  })
}

function getPeerList() {
  return node.getConnections().map(conn => {
    if (conn.remoteAddr.protoCodes().includes(WEBRTC_CODE)) {
      ma = conn.remoteAddr
    }
    return conn.remotePeer
  })
}

function getMultiaddrList() {
  return node.getMultiaddrs().filter(ma => isWebrtc(ma)).map((ma) => ma.toString()).join("\n")
}

function isWebrtc(ma: Multiaddr) {
  return ma.protoCodes().includes(WEBRTC_CODE)
}

export async function registerEvents(callback: (peerNumber: number) => void) {
  node.addEventListener('connection:open', (event) => {
    callback(getPeerList().length)
    console.log(`Connected ${event.detail.remotePeer}`)
  })
  node.addEventListener('connection:close', (event) => {
    callback(getPeerList().length)
    console.log(`Disconnected ${event.detail.remotePeer}`)
  })
  node.addEventListener('self:peer:update', (event) => {
    console.log(`Update ${getMultiaddrList()}`)
  })
  node.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    console.log(`Discovered: ${peer.id.toString()}`)
    if (!getPeerList().includes(peer.id)) {
      node.dial(peer.id)
    }
  })

  node.services.pubsub.addEventListener('message', event => {
    const topic = event.detail.topic
    const message = toString(event.detail.data)
    if (topic == PUBSUB_PEER_DISCOVERY) {
      return console.log('Received pubsub message on pubsub discovery')
    }
    console.log(`Message received on topic '${topic}'`)
    console.log(message)
  })

  await node.handle(CHAT_PROTOCOL, async ({stream}) => {
    chatStream = byteStream(stream)

    while (true) {
      const buf = await chatStream.read()
      console.log(`Received message '${toString(buf.subarray())}'`)
    }
  })

  node.services.pubsub.subscribe(TOPIC)

}

export async function connectRelay(relayMultiaddr: string) {
  const multiaddr1 = multiaddr(relayMultiaddr)
  ma = multiaddr1
  await node.dial(multiaddr1)
  console.log("relay has connected")
}

export async function publish(message: string) {
  await node.services.pubsub.publish(TOPIC, fromString(message))
}

export async function sendMessage(message: string) {

  if (!chatStream) {
    console.log('Opening chat stream')
    const signal = AbortSignal.timeout(5000)
    console.log(ma, CHAT_PROTOCOL)
    const stream = await node.dialProtocol(ma, CHAT_PROTOCOL, {
      signal
    })
    chatStream = byteStream(stream)

    try {
      Promise.resolve().then(async () => {
        while (true) {
          const buf = await chatStream.read()
          console.log(`Received message '${toString(buf.subarray())}'`)
        }
      })
    } catch (err) {
      if (signal.aborted) {
        console.log('Timed out opening chat stream')
      } else {
        console.log(`Opening chat stream failed - ${err}`)
      }
    }
  }

  console.log(`Sending message '${message}'`)
  chatStream.write(fromString(message))
    .catch(err => {
      console.log(`Error sending message - ${err.message}`)
    })
}
