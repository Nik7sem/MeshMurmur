import React, {FC, RefObject, useCallback, useEffect, useState} from 'react';
import {Button, Menu, Portal, Table} from "@chakra-ui/react";
import {connector} from "@/init.ts";


interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

type PeersType = { id: string, nickname: string, connected: boolean }[]

const PeerConnectionOptions: FC<Props> = ({contentRef}) => {
  const [peers, setPeers] = useState<PeersType>([]);

  const updatePeers = useCallback(() => {
    const newPeers: { id: string, nickname: string, connected: boolean }[] = []
    for (const targetPeerId of Object.keys(connector.actions.peerDiscoveryCoordinator.peerMap)) {
      if (connector.peerId != targetPeerId) {
        newPeers.push({
          id: targetPeerId,
          nickname: connector.actions.targetPeerNickname(targetPeerId),
          connected: targetPeerId in connector.connections
        });
      }
    }
    setPeers(newPeers)
  }, [])

  useEffect(() => {
    updatePeers()
    connector.actions.peerDiscoveryCoordinator.eventEmitter.on('mapChanged', updatePeers)
    return () => {
      connector.actions.peerDiscoveryCoordinator.eventEmitter.off('mapChanged', updatePeers)
    }
  }, [updatePeers])

  return (
    <Table.Root mt="10px" size="sm" striped>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>PeerId</Table.ColumnHeader>
          <Table.ColumnHeader>Nickname</Table.ColumnHeader>
          <Table.ColumnHeader>State</Table.ColumnHeader>
          <Table.ColumnHeader>Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {peers.map(({id, connected, nickname}) =>
          <Table.Row key={id}>
            <Table.Cell>{id}</Table.Cell>
            <Table.Cell>{nickname}</Table.Cell>
            <Table.Cell>{connected ? 'connected' : 'not'}</Table.Cell>
            <Table.Cell>
              <Menu.Root onSelect={({value}) => console.log(id, value)}>
                <Menu.Trigger asChild>
                  <Button variant="outline" size="sm">
                    Open
                  </Button>
                </Menu.Trigger>
                <Portal container={contentRef}>
                  <Menu.Positioner>
                    <Menu.Content>
                      {
                        connected ?
                          <Menu.Item
                            value="disconnect"
                            color="fg.error"
                            _hover={{bg: "bg.error", color: "fg.error"}}
                          >
                            Disconnect...
                          </Menu.Item>
                          :
                          <Menu.Item value="connect">Connect</Menu.Item>
                      }
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table.Root>
  );
};

export default PeerConnectionOptions;