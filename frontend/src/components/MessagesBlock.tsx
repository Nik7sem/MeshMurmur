import React, {FC, useEffect, useRef} from 'react';
import ChatTextMessage from "@/components/ChatTextMessage.tsx";
import {peerId} from "@/init.ts";
import {getShort} from "@/utils/p2p-library/shortId.ts";
import {Container} from "@chakra-ui/react";
import {completeMessageType} from "@/utils/p2p-library/types.ts";
import {isCompleteFile, isCompleteText} from "@/utils/p2p-library/helpers.ts";
import ChatFileMessage from "@/components/ChatFileMessage.tsx";
import {smoothScroll} from "@/utils/smoothScroll.ts";

interface Props {
  messages: completeMessageType[];
}

const MessagesBlock: FC<Props> = ({messages}) => {
  const messagesBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.SCROLL_TO_BOTTOM) {
      smoothScroll(messagesBlockRef.current)
    }
  }, [messages]);

  const onScroll = () => {
    if (!messagesBlockRef.current) return;

    const {scrollHeight, scrollTop, clientHeight} = messagesBlockRef.current;
    const dist = Math.abs(scrollHeight - clientHeight - scrollTop)

    if (dist > 200) {
      window.SCROLL_TO_BOTTOM = false
    }

    if (dist < 1) {
      window.SCROLL_TO_BOTTOM = true
    }
  }

  return (
    <Container ref={messagesBlockRef} onScroll={onScroll} margin="15px" padding={5} height="75vh" maxHeight="80vh"
               overflowY="auto">
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