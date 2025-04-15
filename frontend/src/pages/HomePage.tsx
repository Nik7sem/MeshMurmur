import React, {ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';
import {Button, Center, Container, Input} from "@chakra-ui/react";
import {LuSend} from "react-icons/lu";
import {completeMessageType, fileProgressType} from "@/utils/p2p-library/types.ts";
import {connector, peerId} from "@/init.ts";
import MessagesBlock from "@/components/MessagesBlock.tsx";
import SendOptions from "@/components/SendOptions.tsx";
import FileProgressBar from "@/components/FileProgressBar.tsx";
import TypingNotification from "@/components/TypingNotification.tsx";

const HomePage = () => {
  const [messages, setMessages] = useState<completeMessageType[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [inputValue, setInputValue] = useState<string>('')
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set())
  const [fileProgressData, setFileProgressData] = useState<fileProgressType | null>(null)
  const messageBlockRef = useRef<HTMLDivElement>(null);

  const smoothScroll = useCallback(() => {
    setTimeout(() => {
      if (messageBlockRef.current) {
        messageBlockRef.current.scrollTo({
          top: messageBlockRef.current.scrollHeight,
          behavior: "smooth",
        })
      }
    }, 100)
  }, [])

  const addMessage = useCallback((data: completeMessageType) => {
    smoothScroll()
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
    if (addMessage) {
      connector.onCompleteData = addMessage
      connector.onFileProgress = setNewFileProgress
      connector.onTyping = onTyping
    }
  }, [addMessage])

  function onChangeInput(e: ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    connector.emitTypingEvent()
  }

  function keyDownHandler(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClick()
    }
  }

  function onClick() {
    if (inputValue.length > 0) {
      for (const conn of connector.connectedPeers) {
        connector.sendText({peerId: conn.targetPeerId, data: inputValue})
      }
      addMessage({data: inputValue, peerId})
      setInputValue('')
    }

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        for (const conn of connector.connectedPeers) {
          connector.sendFile({peerId: conn.targetPeerId, file}).then(() => {
            const url = URL.createObjectURL(file)
            addMessage({data: {url, fileName: file.name, fileSize: file.size, fileType: file.type}, peerId})
          })
        }
      }
      setUploadedFiles([])
    }
  }

  return (
    <Container width="100%">
      <MessagesBlock messageBlockRef={messageBlockRef} messages={messages}/>
      <Center marginTop="1vh">
        <SendOptions onClick={onClick} files={uploadedFiles} setFiles={setUploadedFiles}/>
        <Input onKeyDown={keyDownHandler} value={inputValue} onChange={onChangeInput}
               onPaste={(e) => setUploadedFiles([...e.clipboardData.files])}
        />
        <Button marginLeft='5' onClick={onClick} aria-label="Send message">
          <LuSend/>
        </Button>
      </Center>
      <Center>
        <FileProgressBar data={fileProgressData}/>
      </Center>
      <TypingNotification typingPeers={typingPeers}/>
    </Container>
  );
};

export default HomePage;