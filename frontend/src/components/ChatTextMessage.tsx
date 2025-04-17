import {Box, Text} from "@chakra-ui/react";
import {FC} from "react";
import {Tooltip} from "@/components/ui/tooltip.tsx";

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
          <Tooltip content={peerId} showArrow positioning={{placement: "right-end"}} openDelay={300} closeDelay={100}
                   interactive>
            <Text fontSize="sm" fontWeight="bold" mb={1}>
              {username}
            </Text>
          </Tooltip> :
          <></>}
        <Text>{message}</Text>
      </Box>
    </Box>
  );
};

export default ChatTextMessage;