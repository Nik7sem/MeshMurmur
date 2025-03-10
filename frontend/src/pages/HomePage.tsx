import React, {useEffect, useRef, useState} from 'react';
import {Box, Button, Center, Container, Flex, Heading, Text} from "@chakra-ui/react";
import {main} from "@/utils/p2p-library/p2p-node-own.ts";
import {PeerConnection} from "@/utils/p2p-library/webrtc-conn.ts";

const HomePage = () => {
  const connectionsRef = useRef<{ [peerId: string]: PeerConnection }>({})
  const [messages, setMessages] = useState<string[]>([])

  function addMessage(message: string) {
    setMessages([...messages, message])
  }

  useEffect(() => {
    async function start() {
      connectionsRef.current = await main(addMessage)
    }

    start()
  }, [])

  async function onClick() {
    if (Object.keys(connectionsRef.current).length > 0) {
      connectionsRef.current[Object.keys(connectionsRef.current)[0]].send("NEW MESSAGE");
    }
  }

  return (
    <Center width="100%" height="100%">
      <Container textAlign="center">
        <Box>
          <Heading size="6xl">Home Page</Heading>
        </Box>
        <Flex margin="50px" justifyContent="space-around">
          <Button onClick={onClick}>Send message</Button>
        </Flex>
        <Box>
          {messages.map((message, idx) => <Text key={idx} fontSize="xl">{message}</Text>)}
        </Box>
      </Container>
    </Center>
  );
};

export default HomePage;