import {Flex, FormatByte, HStack, Progress} from '@chakra-ui/react';
import React, {useCallback, useEffect, useState} from 'react';
import {fileProgressType} from "@p2p-library/types.ts";
import {connector} from "@/init.ts";

const FileProgressBar = () => {
  const [fileProgressData, setFileProgressData] = useState<Map<string, fileProgressType>>(new Map())

  const setNewFileProgress = useCallback((data: fileProgressType) => {
    setFileProgressData((fileProgressData) => {
      const newMap = new Map(fileProgressData)
      newMap.set(data.fileId, data)
      return newMap
    })

    if (data.progress === 100) {
      setTimeout(() => {
        setFileProgressData((fileProgressData) => {
          const newMap = new Map(fileProgressData)
          newMap.delete(data.fileId)
          return newMap
        })
      }, 1000)
    }
  }, [])

  useEffect(() => {
    connector.actions.onFileProgress = setNewFileProgress
    return () => {
      connector.actions.onFileProgress = undefined
    }
  }, [setNewFileProgress])

  return (
    <Flex width='100%' flexDirection='column' alignItems='flex-start'>
      {Array.from(fileProgressData.entries()).map(([key, data]) =>
        <Progress.Root key={key} value={data.progress} maxW="500px">
          <Progress.Label fontFamily='monospace'>{data.title}: <FormatByte value={data.bitrate}/>/s</Progress.Label>
          <HStack gap="5">
            <Progress.Track flex="1">
              <Progress.Range/>
            </Progress.Track>
            <Progress.ValueText>{data.progress}%</Progress.ValueText>
          </HStack>
        </Progress.Root>
      )}
    </Flex>
  );
};

export default FileProgressBar;