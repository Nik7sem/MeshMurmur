import React, {KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';
import {Center, Container, Heading, IconButton, Input} from "@chakra-ui/react";
import {LuSend} from "react-icons/lu";
import ChatMessage from "@/components/ChatMessage.tsx";
import {logType, messageDataType} from "@/utils/p2p-library/types.ts";
import Logs from "@/components/Logs.tsx";
import {Logger} from "@/utils/p2p-library/logger.ts";
import {Connector} from "@/utils/p2p-library/connector.ts";

const peerId = Math.random().toString(36).substr(2, 9)

const HomePage = () => {
  const connectorRef = useRef<Connector>(null)
  const [messages, setMessages] = useState<messageDataType[]>([])
  const [logs, setLogs] = useState<logType[]>([])
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

  const addLog = useCallback((log: logType) => {
    setLogs((prevLogs) => [...prevLogs, log])
  }, [])

  useEffect(() => {
    if (!connectorRef.current && addMessage && addLog) {
      const logger = new Logger(addLog);
      connectorRef.current = new Connector(peerId, logger, addMessage)
    }
  }, [addMessage, addLog])

  function keyDownHandler(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClick()
    }
  }

  async function onClick() {
    if (!connectorRef.current || inputValue.length === 0) return

    addMessage({text: inputValue, peerId})
    smoothScroll()
    setInputValue('')

    for (const peerId of connectorRef.current.peers) {
      connectorRef.current.send({peerId, text: inputValue})
    }
  }

  return (
    <Container width="100%" height="100%">
      <Center>
        <Heading size="3xl">MeshMurmur</Heading>
      </Center>

      <Center marginTop="1vh">
        <Input onKeyDown={keyDownHandler} value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
        <IconButton marginLeft='5' onClick={onClick} aria-label="Send message">
          <LuSend/>
        </IconButton>
      </Center>

      <Container ref={messageBlockRef} margin="15px" padding={5} height="80vh" maxHeight="80vh" overflowY="auto">
        {messages.map((message, idx) =>
          <ChatMessage message={message.text} username={message.peerId}
                       direction={peerId == message.peerId ? "right" : "left"}
                       key={idx}/>
        )}
      </Container>
      <Logs logs={logs}/>
    </Container>
  );
};

export default HomePage;