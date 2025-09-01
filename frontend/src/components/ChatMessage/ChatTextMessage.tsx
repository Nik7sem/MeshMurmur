import {Box, Text} from "@chakra-ui/react";
import React, {FC} from "react";
import TooltipPeerId from "@/components/TooltipPeerId.tsx";

interface Props {
  username: string
  peerId: string
  message: string
  me: boolean
}

const ChatTextMessage: FC<Props> = ({username, peerId, message, me}) => {
  return (
    <Box
      display="flex"
      justifyContent={me ? "flex-end" : "flex-start"}
      my={2}
    >
      <Box
        bg={me ? "blue.500" : "gray.200"}
        color={me ? "white" : "black"}
        px={4}
        py={2}
        borderRadius="lg"
        maxW="75%"
      >
        {!me ?
          <TooltipPeerId peerId={peerId}>
            <Text fontSize="sm" fontWeight="bold" mb={1}>
              {username}
            </Text>
          </TooltipPeerId> :
          <></>}
        <Text whiteSpace="pre-wrap">{message}</Text>
      </Box>
    </Box>
  );
};

export default ChatTextMessage;