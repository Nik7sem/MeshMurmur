import React, {FC, RefObject} from 'react';
import {Button, Center, Container, DataList, Menu, Portal, Separator, Table, Text} from "@chakra-ui/react";
import {AppVersion, connector, peerId} from "@/init.ts";
import TooltipPeerId from "@/components/TooltipPeerId.tsx";

interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

const PeerInfo: FC<Props> = ({contentRef}) => {
  return (
    <Container>
      <DataList.Root marginLeft="20px" orientation="horizontal" maxW="15">
        <DataList.Item>
          <DataList.ItemLabel>App version</DataList.ItemLabel>
          <DataList.ItemValue>{AppVersion}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>PeerId</DataList.ItemLabel>
          <DataList.ItemValue>{peerId}</DataList.ItemValue>
        </DataList.Item>
      </DataList.Root>
      <Separator margin="10px"/>
      <Center>
        <Text fontSize="2xl">Peers</Text>
      </Center>
      <Table.Root mt="10px" size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Nickname</Table.ColumnHeader>
            <Table.ColumnHeader>State</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {connector.peers.map((conn, idx) => (
            <Table.Row key={idx}>
              <TooltipPeerId peerId={conn.targetPeerId}>
                <Table.Cell>{connector.actions.targetPeerNickname(conn.targetPeerId)}</Table.Cell>
              </TooltipPeerId>
              <Table.Cell>{conn.connected ? 'connected' : 'not'}</Table.Cell>
              <Table.Cell>
                <Menu.Root onSelect={({value}) => console.log(conn.targetPeerId, value)}>
                  <Menu.Trigger asChild>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </Menu.Trigger>
                  <Portal container={contentRef}>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.Item value="connect">Connect</Menu.Item>
                        <Menu.Item
                          value="disconnect"
                          color="fg.error"
                          _hover={{bg: "bg.error", color: "fg.error"}}
                        >
                          Disconnect...
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
};

export default PeerInfo;