import {Connector} from "@/utils/p2p-library/connection/connector.ts";
import {completeMessageType, onFileProgressType} from "@/utils/p2p-library/types.ts";
import {TypingEventMiddleware} from "@/utils/p2p-library/middlewares/typingEventMiddleware.ts";
import {FileTransferMiddleware} from "@/utils/p2p-library/middlewares/fileTransferMiddleware.ts";
import {TextMiddleware} from "@/utils/p2p-library/middlewares/textMiddleware.ts";
import {NicknameMiddleware} from "@/utils/p2p-library/middlewares/nicknameMiddleware.ts";
import {getShort} from "@/utils/p2p-library/helpers.ts";
import {UserData} from "@/types/user.ts";
import {PeerDiscoveryCoordinator} from "@/utils/p2p-library/coordinators/PeerDiscoveryCoordinator.ts";
import {DiscoveryMiddleware} from "@/utils/p2p-library/middlewares/discoveryMiddleware.ts";
import {DisconnectEventMiddleware} from "@/utils/p2p-library/middlewares/disconnectEventMiddleware.ts";
import {Logger} from "@/utils/logger.ts";
import {SignatureMiddleware} from "@/utils/p2p-library/middlewares/signatureMiddleware.ts";
import {ManagerMiddleware} from "@/utils/p2p-library/middlewares/managerMiddleware.ts";

export class ActionManager {
  public onCompleteData?: (data: completeMessageType) => void
  public onFileProgress?: onFileProgressType
  public onTyping?: (data: { typing: boolean, peerId: string }) => void
  private nickname = ''
  public peerDiscoveryCoordinator: PeerDiscoveryCoordinator
  public associatedNicknames: UserData['associatedNicknames'] = {}

  constructor(
    private readonly connector: Connector,
    private readonly logger: Logger
  ) {
    this.peerDiscoveryCoordinator = new PeerDiscoveryCoordinator(connector);
  }

  registerCallbacksAndData(managerMiddleware: ManagerMiddleware, targetPeerId: string) {
    const textMiddleware = managerMiddleware.get(TextMiddleware)
    const fileMiddleware = managerMiddleware.get(FileTransferMiddleware)
    const typingMiddleware = managerMiddleware.get(TypingEventMiddleware)
    const nicknameMiddleware = managerMiddleware.get(NicknameMiddleware)
    const discoveryMiddleware = managerMiddleware.get(DiscoveryMiddleware)
    const signatureMiddleware = managerMiddleware.get(SignatureMiddleware)
    const disconnectMiddleware = managerMiddleware.get(DisconnectEventMiddleware)

    if (textMiddleware) {
      textMiddleware.onText = (data) => {
        this.onCompleteData?.({...data, peerId: targetPeerId, nickname: this.targetPeerNickname(targetPeerId)})
      }
    }
    if (fileMiddleware) {
      fileMiddleware.onFileComplete = (data) => {
        this.onCompleteData?.({...data, peerId: targetPeerId, nickname: this.targetPeerNickname(targetPeerId)})
      }
      fileMiddleware.onFileProgress = (data) => this.onFileProgress?.(data)
    }
    if (typingMiddleware) {
      typingMiddleware.onTyping = (data) => this.onTyping?.(data)
    }
    if (nicknameMiddleware) {
      nicknameMiddleware.setNickname(this.nickname)
    }
    if (disconnectMiddleware) {
      disconnectMiddleware.onDisconnect = () => {
        this.logger.warn(`${this.targetPeerNickname(targetPeerId)} disconnected by his own will`);
        this.connector.connections[targetPeerId].disconnect();
      }
    }
    if (signatureMiddleware) {
      signatureMiddleware.setDisconnect(() => {
        this.connector.connections[targetPeerId].disconnect(true);
      })
    }
    if (discoveryMiddleware) {
      discoveryMiddleware.onGossipMessage = (data) => this.peerDiscoveryCoordinator.mergeGossip(data.knownPeers)
    }
  }

  sendText(data: string) {
    for (const conn of this.connector.connectedPeers) {
      conn.managerMiddleware?.get(TextMiddleware)?.sendText(data)
    }
  }

  sendFile(file: File) {
    return Promise.all(this.connector.connectedPeers.map(async conn =>
      conn.managerMiddleware?.get(FileTransferMiddleware)?.sendFile(file)
    ))
  }

  emitTypingEvent() {
    for (const conn of this.connector.connectedPeers) {
      conn.managerMiddleware?.get(TypingEventMiddleware)?.emitTypingEvent()
    }
  }

  emitDisconnectEvent(targetPeerId?: string) {
    if (targetPeerId) {
      this.connector.connections[targetPeerId].managerMiddleware?.get(DisconnectEventMiddleware)?.emitDisconnect()
      return
    }
    for (const conn of this.connector.connectedPeers) {
      conn.managerMiddleware?.get(DisconnectEventMiddleware)?.emitDisconnect()
    }
  }

  sendNickname(nickname: string) {
    this.nickname = nickname;
    for (const conn of this.connector.peers) {
      conn.managerMiddleware?.get(NicknameMiddleware)?.setNickname(this.nickname)
    }
  }

  targetPeerNickname(targetPeerId: string) {
    if (!(targetPeerId in this.connector.connections)) {
      return getShort(targetPeerId)
    }
    const nickname = this.connector.connections[targetPeerId].managerMiddleware?.get(NicknameMiddleware)?.targetPeerNickname
    const associated = this.associatedNicknames[targetPeerId]
    if (nickname && associated) return `${nickname}#${associated}`
    if (nickname) return `${nickname}`
    if (associated) return `${associated}`
    return getShort(targetPeerId)
  }
}