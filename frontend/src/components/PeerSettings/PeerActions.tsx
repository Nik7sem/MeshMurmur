import React from 'react';
import {Alert, Box, Button, CloseButton, Collapsible, Dialog, Portal} from "@chakra-ui/react";
import {edKeyManager} from "@/init.ts";

const PeerActions = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm">
          Show keys
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop/>
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Keys</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Alert.Root status="error">
                <Alert.Indicator/>
                <Alert.Title>
                  Never share your private key with others.
                </Alert.Title>
              </Alert.Root>
              <Collapsible.Root unmountOnExit>
                <Collapsible.Trigger paddingY="3">Show</Collapsible.Trigger>
                <Collapsible.Content>
                  <Box padding="4" borderWidth="1px">
                    {edKeyManager.exportKeyPair()}
                  </Box>
                </Collapsible.Content>
              </Collapsible.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button>Copy to clipboard</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm"/>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default PeerActions;