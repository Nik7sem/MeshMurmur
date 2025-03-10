import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Box,
  Button,
  Center,
  Collapsible,
  Container,
  Flex,
  Heading,
  IconButton,
  Input,
  Separator,
  Text
} from "@chakra-ui/react";
import {main} from "@/utils/p2p-library/p2p-node-own.ts";
import {PeerConnection} from "@/utils/p2p-library/webrtc-conn.ts";
import {LuSend} from "react-icons/lu";
import ChatMessage from "@/components/ChatMessage.tsx";
import {logType} from "@/utils/p2p-library/types.ts";
import Logs from "@/components/Logs.tsx";

const peerId = Math.random().toString(36).substr(2, 9)

const HomePage = () => {
  const connectionsRef = useRef<{ [peerId: string]: PeerConnection }>({})
  const [messages, setMessages] = useState<{ text: string, peerId: string }[]>([])
  const [logs, setLogs] = useState<logType[]>([])
  const [inputValue, setInputValue] = useState<string>('')
  const messageBlockRef = useRef<HTMLDivElement>(null);
  const addMessage = useCallback((text: string, peerId: string) => {
    setMessages((prevMessages) => [...prevMessages, {text, peerId}]);
  }, []);
  const addLog = useCallback((log: logType) => {
    setLogs((prevLogs) => [...prevLogs, log])
  }, [])

  useEffect(() => {
    async function start() {
      connectionsRef.current = await main(peerId, addLog, addMessage)
    }

    start()
  }, [])

  async function onClick() {
    setTimeout(() => {
      if (messageBlockRef.current) {
        messageBlockRef.current.scrollTo({
          top: messageBlockRef.current.scrollHeight,
          behavior: "smooth",
        })
      }
    }, 100);

    addMessage(inputValue, peerId)
    setInputValue('')
    for (const [peerId, pc] of Object.entries(connectionsRef.current)) {
      pc.send(inputValue)
    }
  }

  return (
    <Container width="100%" height="100%">
      <Center>
        <Heading size="3xl">MeshMurmur</Heading>
      </Center>

      <Center marginTop="1vh">
        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
        <IconButton marginLeft='5' onClick={onClick} aria-label="Send message">
          <LuSend/>
        </IconButton>
      </Center>

      <Container ref={messageBlockRef} margin="15px" padding={5} height="45vh" maxHeight="45vh" overflowY="auto">
        {messages.map((message, idx) =>
          <ChatMessage message={message.text} username={peerId} direction={peerId == message.peerId ? "right" : "left"}
                       key={idx}/>
        )}
      </Container>
      <Logs logs={logs}/>
    </Container>
  );
};

export default HomePage;