import React, {useCallback, useEffect, useState} from 'react';
import {Box, Flex, Heading, Status} from "@chakra-ui/react";
import {ColorModeButton} from "@/components/ui/color-mode.tsx";
import Logs from "@/components/Logs.tsx";
import {logType} from "@/utils/p2p-library/types.ts";
import {connector, logger} from "@/init.ts";
import useToast from "@/hooks/useToast.tsx";
import {Toaster} from "@/components/ui/toaster"

const Header = () => {
  const [logs, setLogs] = useState<logType[]>([])
  const {successToast, warningToast, errorToast} = useToast()

  const addLog = useCallback((log: logType) => {
    if (log.type === "success") successToast(log.text)
    if (log.type === "warn") warningToast(log.text)
    if (log.type === "error") errorToast(log.text)
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
      <Box>
        <Status.Root colorPalette="green"><Status.Indicator/>{connector.connectedPeers.length}</Status.Root>
      </Box>
      <Toaster/>
    </Flex>
  );
};

export default Header;