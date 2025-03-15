import React, {KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';
import {Button, Center, Container, Input} from "@chakra-ui/react";
import {LuSend} from "react-icons/lu";
import {completeMessageType} from "@/utils/p2p-library/types.ts";
import {connector, peerId} from "@/init.ts";
import MessagesBlock from "@/components/MessagesBlock.tsx";
import SendOptions from "@/components/SendOptions.tsx";

const HomePage = () => {
  const [messages, setMessages] = useState<completeMessageType[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [inputValue, setInputValue] = useState<string>('')
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

  useEffect(() => {
    if (addMessage) {
      connector.setOnCompleteData(addMessage)
    }
  }, [addMessage])

  function keyDownHandler(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClick()
    }
  }

  function onClick() {
    if (inputValue.length > 0) {
      for (const conn of connector.connectedPeers) {
        connector.send({peerId: conn.targetPeerId, data: inputValue})
      }
      addMessage({data: inputValue, peerId})
      setInputValue('')
    }

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        for (const conn of connector.connectedPeers) {
          connector.sendFile({peerId: conn.targetPeerId, file})
        }
        const url = URL.createObjectURL(file)
        addMessage({data: {url, fileName: file.name, fileSize: file.size, fileType: file.type}, peerId})
      }
      setUploadedFiles([])
    }
  }

  return (
    <Container width="100%">
      <MessagesBlock messageBlockRef={messageBlockRef} messages={messages}/>
      <Center marginTop="1vh">
        <SendOptions onClick={onClick} files={uploadedFiles} setFiles={setUploadedFiles}/>
        <Input onKeyDown={keyDownHandler} value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
        <Button marginLeft='5' onClick={onClick} aria-label="Send message">
          <LuSend/>
        </Button>
      </Center>
    </Container>
  );
};

export default HomePage;