import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {completeMessageType, onFileProgressType} from "@/utils/p2p-library/types.ts";
import {TypingEventMiddleware} from "@/utils/p2p-library/middlewares/typingEventMiddleware.ts";
import {FileTransferMiddleware} from "@/utils/p2p-library/middlewares/fileTransferMiddleware.ts";
import {TextMiddleware} from "@/utils/p2p-library/middlewares/textMiddleware.ts";
import {NicknameMiddleware} from "@/utils/p2p-library/middlewares/nicknameMiddleware.ts";
import {getShort} from "@/utils/p2p-library/helpers.ts";
import {UserData} from "@/types/user.ts";

export class ActionManager {
  public onCompleteData?: (data: completeMessageType) => void
  public onFileProgress?: onFileProgressType
  public onTyping?: (data: { typing: boolean, peerId: string }) => void
  private nickname = ''
  public associatedNicknames: UserData['associatedNicknames'] = {}

  constructor(
    private readonly connector: Connector,
  ) {
  }

  registerCallbacksAndData(targetPeerId: string) {
    const textMiddleware = this.connector.connections[targetPeerId].managerMiddleware.get(TextMiddleware)
    const fileMiddleware = this.connector.connections[targetPeerId].managerMiddleware.get(FileTransferMiddleware)
    const typingMiddleware = this.connector.connections[targetPeerId].managerMiddleware.get(TypingEventMiddleware)
    const nicknameMiddleware = this.connector.connections[targetPeerId].managerMiddleware.get(NicknameMiddleware)

    if (textMiddleware) {
      textMiddleware.onText = (data) => {
        this.onCompleteData?.({...data, nickname: this.targetPeerNickname(data.peerId)})
      }
    }
    if (fileMiddleware) {
      fileMiddleware.onFileComplete = (data) => {
        this.onCompleteData?.({...data, nickname: this.targetPeerNickname(data.peerId)})
      }
      fileMiddleware.onFileProgress = (data) => this.onFileProgress?.(data)
    }
    if (typingMiddleware) {
      typingMiddleware.onTyping = (data) => this.onTyping?.(data)
    }
    if (nicknameMiddleware) {
      if (this.nickname) {
        nicknameMiddleware.setNickname(this.nickname)
      }
    }
  }

  sendText(data: string) {
    for (const conn of this.connector.connectedPeers) {
      conn.managerMiddleware.get(TextMiddleware)?.sendText(data)
    }
  }

  sendFile(file: File) {
    return Promise.all(this.connector.connectedPeers.map(async conn =>
      conn.managerMiddleware.get(FileTransferMiddleware)?.sendFile(file)
    ))
  }

  emitTypingEvent() {
    for (const conn of this.connector.connectedPeers) {
      conn.managerMiddleware.get(TypingEventMiddleware)?.emitTypingEvent()
    }
  }

  sendNickname(nickname: string) {
    this.nickname = nickname;
    for (const conn of this.connector.peers) {
      conn.managerMiddleware.get(NicknameMiddleware)?.setNickname(this.nickname)
    }
  }

  targetPeerNickname(targetPeerId: string) {
    const nickname = this.connector.connections[targetPeerId].managerMiddleware.get(NicknameMiddleware)?.targetPeerNickname
    const associated = this.associatedNicknames[targetPeerId]
    if (nickname && associated) return `${nickname}#${associated}`
    if (nickname) return `${nickname}`
    if (associated) return `${associated}`
    return getShort(targetPeerId)
  }
}