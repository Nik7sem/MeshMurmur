import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {completeMessageType, onFileProgressType} from "@/utils/p2p-library/types.ts";
import {TypingEventMiddleware} from "@/utils/p2p-library/middlewares/typingEventMiddleware.ts";
import {FileTransferMiddleware} from "@/utils/p2p-library/middlewares/fileTransferMiddleware.ts";
import {TextMiddleware} from "@/utils/p2p-library/middlewares/textMiddleware.ts";
import {NicknameMiddleware} from "@/utils/p2p-library/middlewares/nicknameMiddleware.ts";
import {getShort} from "@/utils/p2p-library/helpers.ts";

export class ActionManager {
  public onCompleteData?: (data: completeMessageType) => void
  public onFileProgress?: onFileProgressType
  public onTyping?: (data: { typing: boolean, peerId: string }) => void
  private nickname = ''

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
      textMiddleware.onText = (data) => this.onCompleteData?.(data)
    }
    if (fileMiddleware) {
      fileMiddleware.onFileComplete = (data) => this.onCompleteData?.(data)
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

  // TODO: in mega rare cases, nickname on transferred
  sendNickname(nickname: string) {
    this.nickname = nickname;
    for (const conn of this.connector.connectedPeers) {
      conn.managerMiddleware.get(NicknameMiddleware)?.setNickname(this.nickname)
    }
  }

  targetPeerNickname(targetPeerId: string) {
    return this.connector.connections[targetPeerId].managerMiddleware.get(NicknameMiddleware)?.targetPeerNickname || getShort(targetPeerId)
  }
}