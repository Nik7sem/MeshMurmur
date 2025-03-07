import React, {useEffect, useState} from 'react';
import {Box, Button, Center, Container, Flex, Heading, Input, Text} from "@chakra-ui/react";
import {node, registerEvents, connectRelay, sendMessage, publish} from "../utils/p2p-library/p2p-node.ts"

const HomePage = () => {
  const [peerNumber, setPeerNumber] = useState(0);

  useEffect(() => {
    node.start()
    registerEvents((peerNumber) => setPeerNumber(peerNumber))
  }, [])

  async function onClick() {
    const ma = prompt("Multiaddr:") || ''
    await connectRelay(ma)
  }

  async function onClick2() {
    const message = prompt("message:") || ''
    await sendMessage(message)
  }

  async function onClick3() {
    const message = prompt("message:") || ''
    await publish(message)
  }

  return (
    <Center width="100%" height="100%">
      <Container textAlign="center">
        <Box>
          <Heading size="6xl">Home Page</Heading>
        </Box>
        <Flex margin="50px" justifyContent="space-around">
          <Button onClick={onClick}>Connect</Button>
          <Button onClick={onClick2}>Send message</Button>
          <Button onClick={onClick3}>Publish</Button>
        </Flex>
        <Box>
          <Text fontSize="7xl">{peerNumber}</Text>
        </Box>
      </Container>
    </Center>
  );
};

export default HomePage;