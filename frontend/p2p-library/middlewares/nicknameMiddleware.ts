import {Middleware} from "@p2p-library/abstract.ts";
import {ChannelEventBase, eventDataType} from "@p2p-library/types.ts";

export class NicknameMiddleware extends Middleware {
  static name = "NicknameMiddleware"
  public targetPeerNickname = ''
  private ready = false
  private onready?: () => void

  async init(eventData: ChannelEventBase) {
    if (eventData.channelType === "reliable") {
      this.onready?.()
      this.ready = true
    }
  }

  protected requiresInit(): boolean {
    return true
  }

  private sendNickname(nickname: string) {
    this.channel.reliable.send({type: 'nickname', data: nickname})
    this.logger.info('Sent nickname')
  }

  call(eventData: eventDataType) {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'reliable') return true
    if (eventData.type === 'nickname') {
      this.targetPeerNickname = eventData.data as string
      this.logger.info('Receive nickname')
      this.onInitialize()
      return false
    }
    return true
  }

  setNickname(nickname: string) {
    if (this.ready) {
      this.sendNickname(nickname)
    } else {
      this.onready = () => this.sendNickname(nickname)
    }
  }
}