import {Signaler} from "@p2p-library/abstract.ts";
import {Logger} from "@p2p-library/logger.ts";
import {signalerNameType} from "@p2p-library/types.ts";
import {signalers} from "@p2p-library/conf.ts";
import {FirebaseSignaler} from "@p2p-library/signalers/firebase-signaler.ts";
import {WebsocketSignaler} from "@p2p-library/signalers/websocket-signaler.ts";

export function createSignaler(signalerName: signalerNameType, peerId: string, logger: Logger): Signaler {
  const signaler = signalers[signalerName]
  const childLogger = logger.createChild(signalerName)
  if (signaler.type === 'firebase') {
    return new FirebaseSignaler(peerId, signaler.config, childLogger);
  } else {
    return new WebsocketSignaler(peerId, signaler.config, childLogger);
  }
}