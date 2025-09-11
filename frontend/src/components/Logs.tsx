import React, {useState} from 'react';
import {Box, Button, HStack, Separator, Text, VStack} from "@chakra-ui/react";
import LogLabel from "@/components/LogLabel.tsx";
import {logger} from "@/init.ts";

const Logs = () => {
  const [isDebugMode, setDebugMode] = useState<boolean>(false);

  function onClickDebug() {
    setDebugMode(!isDebugMode);
  }

  function onClickClear() {
    logger.logs = []
  }

  return (
    <VStack align="start" padding={2}>
      <HStack>
        <Button bg={isDebugMode ? 'green.400' : 'white'} width='110px'
                onClick={onClickDebug}>{isDebugMode ? "Debug mode" : "Info mode"}</Button>
        <Button onClick={onClickClear}>Clear logs</Button>
      </HStack>
      <Separator/>
      {logger.logs.filter(log => log.type === 'debug' ? isDebugMode : true).map((log, idx) =>
        <Box key={idx}><LogLabel type={log.type}/> <Text>{log.text}</Text></Box>
      )}
    </VStack>
  );
};

export default Logs;