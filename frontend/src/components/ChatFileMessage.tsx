import React, {FC} from 'react';
import {
  Box,
  Image,
  Link,
  Text,
} from '@chakra-ui/react';
import {useColorModeValue} from "@/components/ui/color-mode.tsx";
import {completeFileType} from "@/utils/p2p-library/types.ts";

interface Props {
  username: string; // peer username
  data: completeFileType['data'] // file metadata and file url object
  me: boolean; // if peer is sender
}

const ChatFileMessage: FC<Props> = ({username, data, me}) => {
  const {url, fileName, fileSize, fileType} = data;

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    const kb = size / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');

  // Bubble background color
  const light = me ? 'blue.100' : 'gray.100';
  const dark = me ? 'blue.700' : 'gray.700';
  const bubbleBg = useColorModeValue(light, dark);

  // Align to the right if "me", left otherwise
  const containerAlignment = me ? 'flex-end' : 'flex-start';

  // Telegram-like bubble border radii
  const bubbleBorderRadius = me
    ? '20px 0px 20px 20px'
    : '0px 20px 20px 20px';

  // For videos, use a wider fixed max width; otherwise 80% of container
  // Also add a minWidth to keep videos from becoming too narrow
  const bubbleMinW = isVideo ? '280px' : undefined;
  const bubbleMaxW = isVideo ? '500px' : '80%';

  return (
    <Box display="flex" justifyContent={containerAlignment} mb={2} px={2}>
      <Box
        minW={bubbleMinW}
        maxW={bubbleMaxW}
        bg={bubbleBg}
        p={3}
        borderRadius={bubbleBorderRadius}
        boxShadow="sm"
        position="relative"
      >
        {!me && (
          <Text fontSize="sm" fontWeight="bold" mb={1}>
            {username}
          </Text>
        )}

        {isImage ? (
          <Image
            src={url}
            alt={fileName}
            borderRadius="md"
            w="full"
            maxH="300px"
            objectFit="cover"
          />
        ) : isVideo ? (
          // Simply wrap <video> in a Box so it can size to the container.
          <Box borderRadius="md" overflow="hidden">
            <video
              src={url}
              controls
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
              }}
            />
          </Box>
        ) : (
          <Box>
            <Link href={url} color="blue.500" fontWeight="bold">
              {fileName}
            </Link>
            <Text fontSize="xs" color="gray.500">
              {formatFileSize(fileSize)}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatFileMessage;

