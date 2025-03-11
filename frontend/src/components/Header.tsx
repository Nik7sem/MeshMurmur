import React, {useCallback, useEffect, useState} from 'react';
import {Box, Center, DataList, Flex, Heading, Status, Text} from "@chakra-ui/react";
import {ColorModeButton} from "@/components/ui/color-mode.tsx";
import Logs from "@/components/Logs.tsx";
import {logType} from "@/utils/p2p-library/types.ts";
import {connector, logger, peerId} from "@/init.ts";

const Header = () => {
  const [logs, setLogs] = useState<logType[]>([])

  const addLog = useCallback((log: logType) => {
    setLogs((prevLogs) => [...prevLogs, log])
  }, [])

  useEffect(() => {
    logger.setOnLog(addLog)
  }, [])

  return (
    <Flex justifyContent="space-between" padding="20px" paddingRight="50px">
      <ColorModeButton alignSelf="start"/>
      <Heading size="3xl">MeshMurmur</Heading>
      <Logs logs={logs}/>
      <Box><Status.Root colorPalette="green"><Status.Indicator/>{connector.peers.length}</Status.Root></Box>
    </Flex>
  );
};

export default Header;