import React, {FC} from 'react';
import {AspectRatio, Box, Flex, Link, Text} from "@chakra-ui/react";
import TooltipPeerId from "@/components/TooltipPeerId.tsx";

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
    <Link href={link} target="_blank" color="blue.500" fontWeight="bold">{link}</Link>
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
    <Flex
      justifyContent={me ? "flex-end" : "flex-start"}
      my={2}
    >
      <Box
        bg={me ? "blue.800" : "gray.200"}
        color={me ? "white" : "black"}
        px={2}
        py={2}
        borderRadius="lg"
      >
        {!me ?
          <TooltipPeerId peerId={peerId}>
            <Text fontSize="sm" fontWeight="bold" mb={1}>
              {username}
            </Text>
          </TooltipPeerId> :
          <></>}
        {renderMessageContent(message)}
      </Box>
    </Flex>
  )
}

export default ChatLinkMessage;