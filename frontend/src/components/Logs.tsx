import React, {FC, useState} from 'react';
import {Box, Collapsible, VStack, Text, HStack, Status, Drawer, Button, Portal, CloseButton} from "@chakra-ui/react";
import {logType} from "@/utils/p2p-library/types.ts";
import LogLabel from "@/components/LogLabel.tsx";

interface Props {
  logs: logType[]
}

const Logs: FC<Props> = ({logs}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Drawer.Root size="xl" open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Drawer.Trigger asChild>
        <Button variant="outline" size="sm" paddingY="3">
          {isOpen ? "Hide Logs ▲" : "Show Logs ▼"}
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop/>
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Logs</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <VStack align="start" padding={2}>
                {logs.map((log, idx) =>
                  <Box key={idx}><LogLabel type={log.type}/> <Text>{log.text}</Text></Box>
                )}
              </VStack>
            </Drawer.Body>
            {/*<Drawer.Footer>*/}
            {/*  <Button variant="outline">Cancel</Button>*/}
            {/*  <Button>Save</Button>*/}
            {/*</Drawer.Footer>*/}
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm"/>
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export default Logs;