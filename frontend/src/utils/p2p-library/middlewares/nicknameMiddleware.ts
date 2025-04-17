import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {ChannelEventBase, eventDataType} from "@/utils/p2p-library/types.ts";

export class NicknameMiddleware extends Middleware {
  private initialized = false
  private peerNickname = ''
  public targetPeerNickname = ''

  async init(eventData: ChannelEventBase) {
    if (eventData.channelType === "reliable") {
      this.sendNickname()
      this.initialized = true
    }
  }

  private sendNickname() {
    if (this.peerNickname) {
      this.conn.channel.reliable.send({type: 'nickname', data: this.peerNickname})
    }
  }

  call(eventData: eventDataType) {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'reliable') return true
    if (eventData.type === 'nickname') {
      this.targetPeerNickname = eventData.data as string
      return false
    }
    return true
  }

  setNickname(nickname: string) {
    if (this.peerNickname === nickname) return
    this.peerNickname = nickname;
    if (this.initialized) {
      this.sendNickname()
    }
  }
}