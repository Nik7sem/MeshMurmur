import {Box, Text} from "@chakra-ui/react";
import {FC} from "react";

interface Props {
  username: string
  message: string
  direction: "left" | "right"
}

const ChatMessage: FC<Props> = ({username, message, direction = "left"}) => {
  return (
    <Box
      display="flex"
      justifyContent={direction === "right" ? "flex-end" : "flex-start"}
      my={2}
    >
      <Box
        bg={direction === "right" ? "blue.500" : "gray.200"}
        color={direction === "right" ? "white" : "black"}
        px={4}
        py={2}
        borderRadius="lg"
        maxW="75%"
      >
        <Text fontSize="sm" fontWeight="bold" mb={1}>
          {username}
        </Text>
        <Text>{message}</Text>
      </Box>
    </Box>
  );
};

export default ChatMessage;