import React, {useCallback, useEffect, useState} from 'react';
import {Box, Button, HStack, Separator, Text, VStack} from "@chakra-ui/react";
import LogLabel from "@/components/LogLabel.tsx";
import {connector, logger} from "@/init.ts";
import {logType} from "@/utils/p2p-library/types.ts";

const Logs = () => {
  const [isDebugMode, setDebugMode] = useState<boolean>(false);
  const [logs, setLogs] = useState<logType[]>([]);

  const updateLogs = useCallback(() => {
    setLogs(logger.logs.filter(log => log.type === 'debug' ? isDebugMode : true));
  }, [isDebugMode])

  function onClickDebug() {
    setDebugMode(!isDebugMode);
  }

  function onClickClear() {
    logger.logs = []
    setLogs([]);
  }

  useEffect(() => {
    updateLogs()
    connector.eventEmitter.on('onPeerConnectionChanged', updateLogs)
    return () => {
      connector.eventEmitter.on('onPeerConnectionChanged', updateLogs)
    }
  }, [updateLogs])

  return (
    <VStack align="start" padding={2}>
      <HStack>
        <Button bg={isDebugMode ? 'green.400' : 'white'} width='110px'
                onClick={onClickDebug}>{isDebugMode ? "Debug mode" : "Info mode"}</Button>
        <Button onClick={onClickClear}>Clear logs</Button>
      </HStack>
      <Separator/>
      {logs.map((log, idx) =>
        <Box key={idx}><LogLabel type={log.type}/> <Text>{log.text}</Text></Box>
      )}
    </VStack>
  );
};

export default Logs;