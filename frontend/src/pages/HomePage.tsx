import React, {KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';
import {Center, Container, Heading, IconButton, Input} from "@chakra-ui/react";
import {LuSend} from "react-icons/lu";
import ChatMessage from "@/components/ChatMessage.tsx";
import {messageDataType} from "@/utils/p2p-library/types.ts";
import {connector, peerId} from "@/init.ts";

const HomePage = () => {
  const [messages, setMessages] = useState<messageDataType[]>([])
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

  const addMessage = useCallback(({peerId, text}: messageDataType) => {
    smoothScroll()
    setMessages((prevMessages) => [...prevMessages, {text, peerId}]);
  }, []);

  useEffect(() => {
    if (addMessage) {
      connector.setOnMessage(addMessage)
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

    for (const peerId of connector.peerIds) {
      connector.send({peerId, text: inputValue})
    }
  }

  return (
    <Container width="100%">
      <Container ref={messageBlockRef} margin="15px" padding={5} height="75vh" maxHeight="80vh" overflowY="auto">
        {messages.map((message, idx) =>
          <ChatMessage message={message.text} username={message.peerId}
                       direction={peerId == message.peerId ? "right" : "left"}
                       key={idx}/>
        )}
      </Container>
      <Center marginTop="1vh">
        <Input onKeyDown={keyDownHandler} value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
        <IconButton marginLeft='5' onClick={onClick} aria-label="Send message">
          <LuSend/>
        </IconButton>
      </Center>
    </Container>
  );
};

export default HomePage;