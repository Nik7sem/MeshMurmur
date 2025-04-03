import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {eventDataType} from "@/utils/p2p-library/types.ts";

// TODO: Use zod for types
export class DiscoveryMiddleware extends Middleware {
  call(eventData: eventDataType): boolean {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'unreliable') return true

    console.log(eventData.data)
    return false
  }
}