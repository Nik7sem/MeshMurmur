import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {eventDataType} from "@/utils/p2p-library/types.ts";
import {AppConfig} from "@/utils/p2p-library/conf.ts";

export class PingMiddleware extends Middleware {
  static name = "PingMiddleware"
  private resolve?: (value: number) => void
  private timeoutId?: NodeJS.Timeout
  private startPingTime: number = 0

  resolvePing(success: boolean) {
    if (success) {
      this.resolve?.(new Date().getTime() - this.startPingTime);
    } else {
      this.resolve?.(0);
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    this.startPingTime = 0
    this.resolve = undefined;
    this.timeoutId = undefined;
  }

  call(eventData: eventDataType) {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'reliable') return true
    if (eventData.type === "ping") {
      if (eventData.data === "ping") {
        this.logger.info(`Ping from ${this.targetPeerId}`)
        this.channel.reliable.send({type: 'ping', data: 'pong'})
        this.logger.info(`Pong to ${this.targetPeerId}`)
      } else {
        this.resolvePing(true)
        this.logger.info(`Pong from ${this.targetPeerId}`)
      }
      return false
    }
    return true
  }

  public sendPing(): Promise<number> {
    this.startPingTime = new Date().getTime();
    this.channel.reliable.send({type: 'ping', data: 'ping'})
    this.logger.info(`Ping to ${this.targetPeerId}`)
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.timeoutId = setTimeout(() => {
        this.resolvePing(false)
      }, AppConfig.pingTimeout)
    })
  }
}
