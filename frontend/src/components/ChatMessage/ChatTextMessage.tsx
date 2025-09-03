import {Text} from "@chakra-ui/react";
import React, {FC} from "react";
import ChatMessage from "@/components/ChatMessage/ChatMessage.tsx";

interface Props {
  username: string
  peerId: string
  message: string
  me: boolean
}

const ChatTextMessage: FC<Props> = ({username, peerId, message, me}) => {
  return (
    <ChatMessage username={username} peerId={peerId} me={me}>
      <Text color={me ? "white" : "black"} whiteSpace="pre-wrap" wordBreak='break-all'>{message}</Text>
    </ChatMessage>
  );
};

export default ChatTextMessage;