import React, {KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';
import {Center, Container, DataList, Heading, IconButton, Input, Text} from "@chakra-ui/react";
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
      window.addEventListener("beforeunload", function (e) {
        if (connectorRef.current) connectorRef.current.cleanup()
      });
    }
  }, [addMessage, addLog])

  function keyDownHandler(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClick()
    }
  }

  function onClick() {
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
        <Logs logs={logs}/>
        <Heading size="3xl">MeshMurmur</Heading>
        <DataList.Root marginLeft="40px" orientation="horizontal" maxW="5">
          <DataList.Item>
            <DataList.ItemLabel>PeerId</DataList.ItemLabel>
            <DataList.ItemValue>{peerId}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Potential peers</DataList.ItemLabel>
            <DataList.ItemValue>{connectorRef.current ? connectorRef.current.potentialPeersCount : 0}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Connecting peers</DataList.ItemLabel>
            <DataList.ItemValue>{connectorRef.current ? connectorRef.current.connectingPeersCount : 0}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Connected peers</DataList.ItemLabel>
            <DataList.ItemValue>{connectorRef.current ? connectorRef.current.peers.length : 0}</DataList.ItemValue>
          </DataList.Item>
        </DataList.Root>
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
    </Container>
  );
};

export default HomePage;