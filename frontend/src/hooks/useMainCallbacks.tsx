import {useEffect, useCallback, useState} from 'react';
import {completeMessageType, logType} from "@p2p-library/types.ts";
import {notifyUser} from "@/utils/notifications.ts";
import {getShort} from "@p2p-library/helpers.ts";
import {connector, logger} from "@/init.ts";
import useToast from "@/hooks/useToast.tsx";

const useMainCallbacks = () => {
  const [messages, setMessages] = useState<completeMessageType[]>([])
  const {successToast, warningToast, errorToast} = useToast()

  const addMessage = useCallback((data: completeMessageType) => {
    if (!window.DOCUMENT_VISIBLE) {
      window.SCROLL_TO_BOTTOM = false
      notifyUser(`New message from: ${getShort(data.peerId)}`)
    }
    setMessages((prevMessages) => [...prevMessages, data]);
  }, []);

  const onPeerConnectionChanged = useCallback((data: { status: string, targetPeerId: string }) => {
    let status: 'enter' | 'exit'
    if (data.status === 'connected') {
      status = 'enter'
    } else if (data.status === 'disconnected') {
      status = 'exit'
    } else {
      return
    }
    addMessage({
      time: new Date().getTime(),
      peerId: data.targetPeerId,
      nickname: connector.actions.targetPeerNickname(data.targetPeerId),
      status
    })
  }, [addMessage])

  const onLog = useCallback((log: logType) => {
    if (log.type === "success") successToast(log.text)
    if (log.type === "warn") warningToast(log.text)
    if (log.type === "error") errorToast(log.text)
  }, [errorToast, successToast, warningToast])

  useEffect(() => {
    connector.actions.onCompleteData = addMessage
    logger.onLog = onLog
    connector.eventEmitter.on('onPeerConnectionChanged', onPeerConnectionChanged)
    return () => {
      connector.actions.onCompleteData = undefined
      logger.onLog = undefined
      connector.eventEmitter.off('onPeerConnectionChanged', onPeerConnectionChanged)
    }
  }, [addMessage, onPeerConnectionChanged, onLog])

  return {messages, addMessage}
};

export default useMainCallbacks;