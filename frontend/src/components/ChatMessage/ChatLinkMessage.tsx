import React, {FC} from 'react';
import {AspectRatio, Link} from "@chakra-ui/react";
import ChatMessage from "@/components/ChatMessage/ChatMessage.tsx";

const youtubeVideoRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const youtubeShortsRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/;

function youtubeIframe(embedUrl: string, title: string) {
  return <iframe
    src={embedUrl}
    title={title}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />
}

function renderMessageContent(link: string) {
  const shortsMatch = link.match(youtubeShortsRegex);
  if (shortsMatch) {
    const videoId = shortsMatch[1];
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    return (
      <AspectRatio width='calc(70vh * 9 / 16)' ratio={9 / 16}>
        {youtubeIframe(embedUrl, "YouTube Shorts")}
      </AspectRatio>
    )
  }

  const videoMatch = link.match(youtubeVideoRegex);
  if (videoMatch) {
    const videoId = videoMatch[1];
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    return (
      <AspectRatio width='70vw' ratio={16 / 9}>
        {youtubeIframe(embedUrl, "YouTube video")}
      </AspectRatio>
    )
  }

  return (
    <Link href={link} target="_blank" color="blue.700" fontWeight="bold" overflowWrap='anywhere'
          p='2px 12px 2px 12px'>
      {link}
    </Link>
  )
}

interface Props {
  username: string
  peerId: string
  message: string
  me: boolean
}

const ChatLinkMessage: FC<Props> = ({username, peerId, message, me}) => {
  return (
    <ChatMessage username={username} peerId={peerId} me={me}>
      {renderMessageContent(message)}
    </ChatMessage>
  )
}

export default ChatLinkMessage;