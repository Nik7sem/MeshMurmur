import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {Logger} from "@/utils/logger.ts";
import {signalerNameType} from "@/utils/p2p-library/types.ts";
import {signalers} from "@/utils/p2p-library/conf.ts";
import {FirebaseSignaler} from "@/utils/p2p-library/signalers/firebase-signaler.ts";
import {WebsocketSignaler} from "@/utils/p2p-library/signalers/websocket-signaler.ts";

export function createSignaler(signalerName: signalerNameType, peerId: string, logger: Logger): Signaler {
  const signaler = signalers[signalerName]
  if (signaler.type === 'firebase') {
    return new FirebaseSignaler(peerId, signaler.config);
  } else {
    return new WebsocketSignaler(peerId, logger, signaler.config);
  }
}