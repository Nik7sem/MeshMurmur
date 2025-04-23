import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {eventDataType} from "@/utils/p2p-library/types.ts";
import {PeerConnection} from "@/utils/p2p-library/connection/peerConnection.ts";
import {Logger} from "@/utils/logger.ts";

export class DisconnectEventMiddleware extends Middleware {
  public onDisconnect?: () => void

  constructor(conn: PeerConnection, logger: Logger) {
    super(conn, logger);
  }

  call(eventData: eventDataType) {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'unreliable') return true
    if (eventData.type === "disconnect-event") {
      this.onDisconnect?.();
      return false
    }
    return true
  }

  public emitDisconnect() {
    this.conn.channel.unreliable.send({type: 'disconnect-event', data: null})
  }
}