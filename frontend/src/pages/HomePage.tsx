import React, {KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';
import {Button, Center, Container, FileUpload, Input, Menu, Portal} from "@chakra-ui/react";
import {LuSend} from "react-icons/lu";
import {GrAttachment} from "react-icons/gr";
import ChatMessage from "@/components/ChatMessage.tsx";
import {textDataType} from "@/utils/p2p-library/types.ts";
import {connector, peerId} from "@/init.ts";
import {getShort} from "@/utils/p2p-library/shortId.ts";
import {HiUpload} from "react-icons/hi";

const HomePage = () => {
  const [messages, setMessages] = useState<textDataType[]>([])
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

  const addMessage = useCallback((data: textDataType) => {
    smoothScroll()
    setMessages((prevMessages) => [...prevMessages, data]);
  }, []);

  useEffect(() => {
    if (addMessage) {
      connector.setOnText(addMessage)
    }
  }, [addMessage])

  function keyDownHandler(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClick()
    }
  }

  function onClick() {
    if (inputValue.length === 0) return

    addMessage({text: inputValue, peerId})
    smoothScroll()
    setInputValue('')

    for (const conn of connector.connectedPeers) {
      connector.send({peerId: conn.targetPeerId, text: inputValue})
    }
  }

  return (
    <Container width="100%">
      <Container ref={messageBlockRef} margin="15px" padding={5} height="75vh" maxHeight="80vh" overflowY="auto">
        {messages.map((message, idx) =>
          <ChatMessage message={message.text} username={peerId == message.peerId ? '' : getShort(message.peerId)}
                       direction={peerId == message.peerId ? "right" : "left"}
                       key={idx}/>
        )}
      </Container>
      <Center marginTop="1vh">
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button color="white" bg="black" marginRight='5' onClick={onClick} aria-label="Send message">
              <GrAttachment/>
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <FileUpload.Root>
                  <FileUpload.HiddenInput/>
                  <FileUpload.Trigger asChild>
                    <Button variant="outline" size="sm">
                      <HiUpload/> Send file
                    </Button>
                  </FileUpload.Trigger>
                  <FileUpload.List/>
                </FileUpload.Root>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Input onKeyDown={keyDownHandler} value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
        <Button marginLeft='5' onClick={onClick} aria-label="Send message">
          <LuSend/>
        </Button>
      </Center>
    </Container>
  );
};

export default HomePage;