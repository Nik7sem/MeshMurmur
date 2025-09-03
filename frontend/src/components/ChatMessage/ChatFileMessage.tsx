import React, {FC} from 'react';
import {
  Box, FormatByte,
  Image,
  Link,
  Text,
} from '@chakra-ui/react';
import {completeFileType} from "@/utils/p2p-library/types.ts";
import ImagePreviewDialog from "@/components/ChatMessage/ImagePreviewDialog.tsx";
import ChatMessage from "@/components/ChatMessage/ChatMessage.tsx";

interface Props {
  username: string; // peer username
  peerId: string;
  data: completeFileType['data'] // file metadata and file url object
  me: boolean; // if peer is sender
}

const ChatFileMessage: FC<Props> = ({username, peerId, data, me}) => {
  const {url, fileName, fileSize, fileType} = data;

  return (
    <ChatMessage username={username} peerId={peerId} me={me}>
      {fileType.startsWith('image/') ? (
        <ImagePreviewDialog
          src={url}
          alt={fileName}
          trigger={(onOpen) => (
            <Image
              src={url}
              alt={fileName}
              borderRadius="md"
              w="full"
              maxH="300px"
              objectFit="cover"
              cursor="pointer"
              onClick={onOpen}
            />
          )}
        />
      ) : fileType.startsWith('video/') ? (
        // Simply wrap <video> in a Box so it can size to the container.
        <Box borderRadius="md" overflow="hidden">
          <video
            src={url}
            controls
            style={{
              display: 'block',
              width: 'min(500px, 70vw)',
              height: 'auto',
            }}
          />
          <Text fontSize="xs" color="gray.700" ml='4px'>
            {fileName} · <FormatByte value={fileSize}/>
          </Text>
        </Box>
      ) : fileType.startsWith('audio/') ? (
        <Box p={me ? '4px' : '0'}>
          <audio controls style={{width: 'min(500px, 70vw)', height: '50px'}}>
            <source src={url} type={fileType}/>
            Your browser does not support the audio element.
          </audio>
          <Text fontSize="xs" color="gray.700" ml='4px'>
            {fileName} · <FormatByte value={fileSize}/>
          </Text>
        </Box>
      ) : (
        <Box>
          <Link href={url} p={me ? '4px' : '0 4px 4px 4px'} target="_blank" color="blue.700" fontWeight="bold" download={fileName}>
            {fileName}
          </Link>

          <Text fontSize="xs" color="gray.700" ml='4px'>
            <FormatByte value={fileSize}/>
          </Text>
        </Box>
      )}
    </ChatMessage>
  );
};

export default ChatFileMessage;

