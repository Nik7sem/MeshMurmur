import React, {FC} from 'react';
import {
  Box,
  Image,
  Link,
  Text,
  AspectRatio,
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

  // Format file size to display in B, KB, or MB
  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    const kb = size / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };
  // Check the file type
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');

  // Customize the message bubble background and alignment based on sender
  const light = me ? 'blue.100' : 'gray.100'
  const dark = me ? 'blue.700' : 'gray.700'
  const bubbleBg = useColorModeValue(light, dark);
  const alignSelf = me ? 'flex-end' : 'flex-start';

  return (
    <Box
      maxW="sm"
      bg={bubbleBg}
      p={3}
      borderRadius="md"
      alignSelf={alignSelf}
      my={2}
    >
      {/* Display username if message is from peer */}
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
          maxH="300px"
          objectFit="cover"
        />
      ) : isVideo ? (
        <AspectRatio ratio={16 / 9} borderRadius="md">
          <video controls src={url} style={{borderRadius: 'inherit'}}/>
        </AspectRatio>
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
  );
};

export default ChatFileMessage;
