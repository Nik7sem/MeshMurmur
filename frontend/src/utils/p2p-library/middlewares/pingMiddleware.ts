import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {eventDataType} from "@/utils/p2p-library/types.ts";
import {AppConfig} from "@/utils/p2p-library/conf.ts";

export class PingMiddleware extends Middleware {
  private resolve: ((value: number) => void) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private startPingTime: number = 0

  resolvePing(success: boolean) {
    if (this.resolve) {
      if (success) {
        this.resolve(new Date().getTime() - this.startPingTime);
      } else {
        this.resolve(0);
      }
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    this.startPingTime = 0
    this.resolve = null;
    this.timeoutId = null;
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

  public sendPing(): Promise<number> {
    this.startPingTime = new Date().getTime();
    this.conn.channel.reliable.send({type: 'ping', data: 'ping'})
    this.logger.info(`Ping to ${this.conn.targetPeerId}`)
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.timeoutId = setTimeout(() => {
        this.resolvePing(false)
      }, AppConfig.pingTimeout)
    })
  }
}
