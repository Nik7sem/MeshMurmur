import React, {FC, Ref} from 'react';
import ChatTextMessage from "@/components/ChatTextMessage.tsx";
import {peerId} from "@/init.ts";
import {getShort} from "@/utils/p2p-library/shortId.ts";
import {Container} from "@chakra-ui/react";
import {completeMessageType} from "@/utils/p2p-library/types.ts";
import {isCompleteFile, isCompleteText} from "@/utils/p2p-library/isObjectHelper.ts";
import ChatFileMessage from "@/components/ChatFileMessage.tsx";

interface Props {
  messages: completeMessageType[];
  messageBlockRef: Ref<HTMLDivElement>;
}

const MessagesBlock: FC<Props> = ({messages, messageBlockRef}) => {
  return (
    <Container ref={messageBlockRef} margin="15px" padding={5} height="75vh" maxHeight="80vh" overflowY="auto">
      {messages.map((data, idx) => {
          const me = peerId === data.peerId
          if (isCompleteText(data)) {
            return <ChatTextMessage message={data.data} username={getShort(data.peerId)} me={me} key={idx}/>
          } else if (isCompleteFile(data)) {
            return <ChatFileMessage data={data.data} username={getShort(data.peerId)} me={me} key={idx}/>
          }
        }
      )}
    </Container>
  );
};

export default MessagesBlock;