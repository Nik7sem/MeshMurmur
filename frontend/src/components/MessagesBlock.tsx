import React, {FC, useEffect, useRef} from 'react';
import ChatTextMessage from "@/components/ChatMessage/ChatTextMessage.tsx";
import {peerId, urlRegex} from "@/init.ts";
import {Container} from "@chakra-ui/react";
import {completeMessageType} from "@/utils/p2p-library/types.ts";
import {isChatMemberBadge, isCompleteFile, isCompleteText} from "@/utils/p2p-library/helpers.ts";
import ChatFileMessage from "@/components/ChatMessage/ChatFileMessage.tsx";
import {smoothScroll} from "@/utils/smoothScroll.ts";
import ChatLinkMessage from "@/components/ChatMessage/ChatLinkMessage.tsx";
import Swipeable from "@/components/Swipeable.tsx";
import ChatMemberBadge from "@/components/ChatMessage/ChatMemberBadge.tsx";

interface Props {
  messages: completeMessageType[];
  setReplyMessage: (message: completeMessageType) => void;
}

function getMessageComponent(data: completeMessageType) {
  const me = peerId === data.peerId
  if (isCompleteText(data)) {
    if (data.data.match(urlRegex)) {
      return <ChatLinkMessage message={data.data} peerId={data.peerId} username={data.nickname} me={me}/>
    } else {
      return <ChatTextMessage message={data.data} peerId={data.peerId} username={data.nickname} me={me}/>
    }
  } else if (isCompleteFile(data)) {
    return <ChatFileMessage data={data.data} peerId={data.peerId} username={data.nickname} me={me}/>
  } else if (isChatMemberBadge(data)) {
    return <ChatMemberBadge nickname={data.nickname} status={data.status}/>
  }
}

const MessagesBlock: FC<Props> = ({messages, setReplyMessage}) => {
  const messagesBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.SCROLL_TO_BOTTOM) {
      smoothScroll(messagesBlockRef.current)
    }
  }, [messages]);

  function onScroll() {
    if (!messagesBlockRef.current) return;

    const {scrollHeight, scrollTop, clientHeight} = messagesBlockRef.current;
    const dist = Math.abs(scrollHeight - clientHeight - scrollTop)

    if (dist > 200) {
      window.SCROLL_TO_BOTTOM = false
    }

    if (dist < 20) {
      window.SCROLL_TO_BOTTOM = true
    }
  }

  return (
    <Container ref={messagesBlockRef} onScroll={onScroll} padding={1} height="72vh" maxHeight="72vh"
               overflowY="auto">
      {messages.map((data, idx) =>
        <Swipeable onSwipe={() => setReplyMessage(data)} direction={data.peerId === peerId ? 'left' : 'right'}
                   key={idx}>
          {getMessageComponent(data)}
        </Swipeable>
      )}
    </Container>
  );
};

export default MessagesBlock;