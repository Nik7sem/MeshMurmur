import React, {useCallback, useEffect, useState} from 'react';
import {Box, Text, HStack} from '@chakra-ui/react';
import {connector} from "@/init.ts";

function getTypingText(typingPeers: Set<string>) {
  const names = Array.from(typingPeers).map(peerId => connector.actions.targetPeerNickname(peerId));
  const count = names.length;

  let typingText = '';
  if (count > 0) {
    if (count === 1) {
      typingText = `${names[0]} is typing`;
    } else if (count === 2) {
      typingText = `${names[0]} and ${names[1]} are typing`;
    } else {
      typingText = `${names[0]} and ${count - 1} others are typing`;
    }
  }
  return typingText
}

const TypingNotification = () => {
  const [message, setMessage] = useState('');
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set())

  const onTyping = useCallback((data: { typing: boolean, peerId: string }) => {
    setTypingPeers((typingPeers) => {
      const newTypingPeers = new Set([...typingPeers])
      if (data.typing) {
        newTypingPeers.add(data.peerId)
        setMessage(getTypingText(newTypingPeers))
      } else {
        newTypingPeers.delete(data.peerId)
        setTimeout(() => {
          setMessage(getTypingText(newTypingPeers))
        }, 300)
      }
      return newTypingPeers
    })
  }, [])

  useEffect(() => {
    connector.actions.onTyping = onTyping
    return () => {
      connector.actions.onTyping = undefined
    }
  }, [onTyping]);

  return (
    <Box
      mt={1}
      ml={5}
      opacity={typingPeers.size > 0 ? 1 : 0}
      transition="opacity 0.3s ease-in-out"
    >
      <HStack>
        <Text fontSize="sm" color="gray.500">
          {message}
        </Text>
        <Box display="flex" alignItems="center">
          <Box
            as="span"
            width="4px"
            height="4px"
            bg="gray.500"
            borderRadius="full"
            mx="1px"
            animation="typingDot 1s infinite"
            animationDelay="0s"
          />
          <Box
            as="span"
            width="4px"
            height="4px"
            bg="gray.500"
            borderRadius="full"
            mx="1px"
            animation="typingDot 1s infinite"
            animationDelay="0.2s"
          />
          <Box
            as="span"
            width="4px"
            height="4px"
            bg="gray.500"
            borderRadius="full"
            mx="1px"
            animation="typingDot 1s infinite"
            animationDelay="0.4s"
          />
        </Box>
      </HStack>
      <style>
        {`
          @keyframes typingDot {
            0% { transform: translateY(0); opacity: 0.3; }
            20% { transform: translateY(-3px); opacity: 1; }
            40% { transform: translateY(0); opacity: 0.3; }
            100% { transform: translateY(0); opacity: 0.3; }
          }
        `}
      </style>
    </Box>
  );
};

export default TypingNotification;
