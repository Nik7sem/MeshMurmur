import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {eventDataType} from "@/utils/p2p-library/types.ts";

export class DisconnectEventMiddleware extends Middleware {
  static name = "DisconnectEventMiddleware"
  public onDisconnect?: () => void

  call(eventData: eventDataType) {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'unreliable') return true
    if (eventData.type === "disconnect-event") {
      this.onDisconnect?.();
      return false
    }
    return true
  }

  public emitDisconnect() {
    this.channel.unreliable.send({type: 'disconnect-event', data: null})
  }
}