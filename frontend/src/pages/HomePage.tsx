import React, {useCallback, useEffect, useState} from 'react';
import {Center, Container} from "@chakra-ui/react";
import {completeMessageType, fileProgressType} from "@/utils/p2p-library/types.ts";
import {connector} from "@/init.ts";
import MessagesBlock from "@/components/MessagesBlock.tsx";
import SendOptions from "@/components/SendOptions/SendOptions.tsx";
import FileProgressBar from "@/components/FileProgressBar.tsx";
import TypingNotification from "@/components/TypingNotification.tsx";
import {notifyUser} from "@/utils/notifications.ts";
import {getShort} from "@/utils/p2p-library/helpers.ts";

const HomePage = () => {
  const [messages, setMessages] = useState<completeMessageType[]>([])
  const [replyMessage, setReplyMessage] = useState<completeMessageType | null>(null)
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set())
  const [fileProgressData, setFileProgressData] = useState<fileProgressType | null>(null)

  const addMessage = useCallback((data: completeMessageType) => {
    if (!window.DOCUMENT_VISIBLE) {
      window.SCROLL_TO_BOTTOM = false
      notifyUser(`New message from: ${getShort(data.peerId)}`)
    }
    setMessages((prevMessages) => [...prevMessages, data]);
  }, []);

  const setNewFileProgress = useCallback((data: fileProgressType) => {
    setFileProgressData(data)
    if (data.progress === 100) {
      setTimeout(() => {
        setFileProgressData((fileProgressData) => {
          if (fileProgressData?.progress === 100) {
            return null
          }
          return fileProgressData
        })
      }, 1000)
    }
  }, [])

  const onTyping = useCallback((data: { typing: boolean, peerId: string }) => {
    setTypingPeers((typingPeers) => {
      const newTypingPeers = new Set([...typingPeers])
      if (data.typing) {
        newTypingPeers.add(data.peerId)
      } else {
        newTypingPeers.delete(data.peerId)
      }
      return newTypingPeers
    })
  }, [])

  useEffect(() => {
    if (addMessage && setNewFileProgress && onTyping) {
      connector.actions.onCompleteData = addMessage
      connector.actions.onFileProgress = setNewFileProgress
      connector.actions.onTyping = onTyping
    }
    return () => {
      connector.actions.onCompleteData = undefined
      connector.actions.onFileProgress = undefined
      connector.actions.onTyping = undefined
    }
  }, [addMessage, onTyping, setNewFileProgress])

  return (
    <Container width="100%">
      <MessagesBlock messages={messages} setReplyMessage={setReplyMessage}/>
      <SendOptions addMessage={addMessage} replyMessage={replyMessage} resetReplyMessage={() => setReplyMessage(null)}/>
      <Center>
        <FileProgressBar data={fileProgressData}/>
      </Center>
      <TypingNotification typingPeers={typingPeers}/>
    </Container>
  );
};

export default HomePage;