import React, {useEffect, useRef} from 'react';
import {Box, Button, Center, Container, Flex, Heading, Text} from "@chakra-ui/react";
import {main} from "@/utils/p2p-library/p2p-node-own.ts";

const TestPage = () => {
  const sendRef = useRef<() => void>(null)

  useEffect(() => {
    async function start() {
      sendRef.current = await main()
    }

    start()
  }, [])

  async function onClick() {
    if (sendRef.current) {
      sendRef.current();
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
          {/*<Text fontSize="7xl">{peerNumber}</Text>*/}
        </Box>
      </Container>
    </Center>
  );
};

export default TestPage;