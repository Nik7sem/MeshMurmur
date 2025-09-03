import React, {FC, ReactNode} from 'react';
import {Box, Flex, Text} from "@chakra-ui/react";
import TooltipPeerId from "@/components/TooltipPeerId.tsx";

interface Props {
  username: string
  peerId: string
  me: boolean
  children: ReactNode
}

const ChatMessage: FC<Props> = ({username, peerId, me, children}) => {
  return (
    <Flex justifyContent={me ? "flex-end" : "flex-start"}>
      <Box
        bg={me ? "blue.500" : "gray.200"}
        px='6px'
        py='2px'
        mb='4px'
        borderRadius="lg"
      >
        {!me ?
          <TooltipPeerId peerId={peerId}>
            <Text color={me ? "white" : "black"} fontSize="sm" fontWeight="bold" mb='4px'>
              {username}
            </Text>
          </TooltipPeerId> :
          <></>}
        {children}
      </Box>
    </Flex>
  );
};

export default ChatMessage;