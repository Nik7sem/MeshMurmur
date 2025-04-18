import React, {FC, useEffect, useState} from 'react';
import {Box, Text, HStack} from '@chakra-ui/react';

import {getShort} from "@/utils/p2p-library/helpers.ts";
import {connector} from "@/init.ts";

interface Props {
  typingPeers: Set<string>;
}

const TypingNotification: FC<Props> = ({typingPeers}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const names = Array.from(typingPeers).map(peerId => connector.actions.targetPeerNickname(peerId));
    const count = names.length;

    if (count > 0) {
      let newMessage = '';
      if (count === 1) {
        newMessage = `${names[0]} is typing`;
      } else if (count === 2) {
        newMessage = `${names[0]} and ${names[1]} are typing`;
      } else {
        newMessage = `${names[0]} and ${count - 1} others are typing`;
      }
      setMessage(newMessage);
      setVisible(true);
    } else {
      // Delay hiding the notification to allow fade-out animation
      const timeout = setTimeout(() => setVisible(false), 300); // 300ms matches the animation duration
      return () => clearTimeout(timeout);
    }
  }, [typingPeers]);

  if (!visible) return null;

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
