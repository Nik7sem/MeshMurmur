import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {eventDataType} from "@/utils/p2p-library/types.ts";

export class PingMiddleware extends Middleware {
  private resolve: ((value: boolean) => void) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly pingTimeout = 1500;

  resolvePing(value: boolean) {
    this.resolve!(value);
    this.resolve = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null;
    }
  }

  call(eventData: eventDataType) {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'reliable') return true
    if (eventData.type === "ping") {
      if (eventData.data === "ping") {
        this.logger.info(`Ping from ${this.conn.targetPeerId}`)
        this.conn.channel.reliable.send({type: 'ping', data: 'pong'})
        this.logger.info(`Pong to ${this.conn.targetPeerId}`)
      } else {
        this.resolvePing(true)
        this.logger.info(`Pong from ${this.conn.targetPeerId}`)
      }
      return false
    }
    return true
  }

  public sendPing() {
    this.conn.channel.reliable.send({type: 'ping', data: 'ping'})
    this.logger.info(`Ping to ${this.conn.targetPeerId}`)
    return new Promise((resolve, reject) => {
      this.resolvePing = resolve
      this.timeoutId = setTimeout(() => {
        this.resolvePing(false)
      }, this.pingTimeout)
    })
  }
}
