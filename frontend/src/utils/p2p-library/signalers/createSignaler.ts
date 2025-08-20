import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {FirebaseSignaler} from "@/utils/p2p-library/signalers/firebase-signaler.ts";
import {WebsocketSignaler} from "@/utils/p2p-library/signalers/websocket-signaler.ts";
import {Logger} from "@/utils/logger.ts";

export type signalerType = 'FirebaseSignaler' | 'WebsocketSignalerBipki' | 'WebsocketSignalerDev';

export function createSignaler(signaler: signalerType, peerId: string, logger: Logger): Signaler {
  if (signaler === 'WebsocketSignalerBipki') {
    return new WebsocketSignaler(peerId, logger.createChild('WebsocketSignalerBipki'), "wss://signaler.ddns.net:50000");
  } else if (signaler === 'WebsocketSignalerDev') {
    return new WebsocketSignaler(peerId, logger.createChild('WebsocketSignalerDev'), "wss://localhost:8001");
  } else {
    return new FirebaseSignaler(peerId)
  }
}