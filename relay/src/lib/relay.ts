import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import {circuitRelayServer} from '@libp2p/circuit-relay-v2'
import {identify} from '@libp2p/identify'
import {webSockets} from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import {createLibp2p} from 'libp2p'
import {gossipsub} from '@chainsafe/libp2p-gossipsub'
import {privateKeyFromRaw} from '@libp2p/crypto/keys'
// import {bootstrap} from "@libp2p/bootstrap";
// import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
// import {autoNAT} from "@libp2p/autonat";
// import {generateKeyPair} from '@libp2p/crypto/keys'

// const privateKey = await generateKeyPair('Ed25519')
const PUBSUB_PEER_DISCOVERY = "browser-peer-discovery"

const server = await createLibp2p({
  privateKey: privateKey,
  addresses: {
    listen: ['/ip4/127.0.0.1/tcp/56565/ws']
  },
  transports: [
    webSockets({
      // filter: filters.all
    })
  ],
  // peerDiscovery: [
  //   bootstrap({
  //     list: [
  //       '/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  //       '/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  //     ]
  //   }),
  //   pubsubPeerDiscovery({
  //     interval: 10_000,
  //     topics: [PUBSUB_PEER_DISCOVERY],
  //   })
  // ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    identify: identify(),
    // autoNat: autoNAT(),
    pubsub: gossipsub(),
    relay: circuitRelayServer({
      // disable max reservations limit for demo purposes. in production you
      // should leave this set to the default of 15 to prevent abuse of your
      // node by network peers
      // reservations: {
      //   maxReservations: Infinity
      // }
    })
  }
})

server.services.pubsub.subscribe(PUBSUB_PEER_DISCOVERY)

// console.log('Relay listening on multiaddr(s): ', server.getMultiaddrs().map((ma) => ma.toString().replace("ws", "wss").replace("56565", "56566")))
console.log('Relay listening on multiaddr(s): ', server.getMultiaddrs().map((ma) => ma.toString()))