import React, {FC, RefObject, useCallback, useEffect, useState} from 'react';
import {Button, Menu, Portal, Show, Table, Text} from "@chakra-ui/react";
import {connector, logger} from "@/init.ts";
import {PingMiddleware} from "@/utils/p2p-library/middlewares/pingMiddleware.ts";


interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

type StateType = 'connected' | 'connecting' | 'discovered' | 'signaler'
type PeerInfoType = { id: string, connections: string, nickname: string, state: StateType }
const statesValues = {'connected': 1, 'connecting': 2, 'discovered': 3, 'signaler': 4}

const PeerConnectionTable: FC<Props> = ({contentRef}) => {
  const [peers, setPeers] = useState<PeerInfoType[]>([]);

  const updatePeers = useCallback(() => {
    const newPeers: PeerInfoType[] = []
    const discoveredPeers = new Set(Object.keys(connector.actions.peerDiscoveryCoordinator.peerMap))
    for (const targetPeerId of discoveredPeers) {
      let state: StateType = 'signaler'
      if (targetPeerId in connector.connections) {
        if (connector.connections[targetPeerId].connected) {
          state = "connected"
        } else {
          state = "connecting"
        }
      } else {
        state = "discovered"
      }

      if (connector.peerId != targetPeerId) {
        newPeers.push({
          id: targetPeerId,
          connections: connector.actions.peerDiscoveryCoordinator.peerMap[targetPeerId].connections.length.toString(),
          nickname: connector.actions.targetPeerNickname(targetPeerId),
          state
        });
      }
    }

    for (const targetPeerId of connector.potentialPeers) {
      if (!discoveredPeers.has(targetPeerId)) {
        let state: StateType = 'signaler'
        if (targetPeerId in connector.connections) {
          if (connector.connections[targetPeerId].connected) {
            state = "connected"
          } else {
            state = "connecting"
          }
        } else {
          state = "signaler"
        }
        newPeers.push({
          id: targetPeerId,
          connections: "-",
          nickname: connector.actions.targetPeerNickname(targetPeerId),
          state
        });
      }
    }
    newPeers.sort((a, b) => {
      return statesValues[a.state] - statesValues[b.state]
    })
    setPeers(newPeers)
  }, [])

  useEffect(() => {
    updatePeers()
    connector.actions.peerDiscoveryCoordinator.eventEmitter.on('mapChanged', updatePeers)
    return () => {
      connector.actions.peerDiscoveryCoordinator.eventEmitter.off('mapChanged', updatePeers)
    }
  }, [updatePeers])

  function onSelect(targetPeerId: string, value: string) {
    if (value === 'disconnect') {
      connector.actions.emitDisconnectEvent(targetPeerId)
      connector.connections[targetPeerId].disconnect(false, true)
    } else if (value === 'connect') {
      connector.createConnection(targetPeerId, true, true)
    } else if (value === 'ping') {
      if (connector.connections[targetPeerId].managerMiddleware.get(PingMiddleware)?.sendPing()) {
        logger.success("Pong received!")
      } else {
        logger.error("No response...")
      }
    }
  }

  return (
    <Show when={peers.length > 0} fallback={<Text>Empty</Text>}>
      <Table.Root mt="10px" size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>PeerId</Table.ColumnHeader>
            <Table.ColumnHeader>Nickname</Table.ColumnHeader>
            <Table.ColumnHeader>Connections</Table.ColumnHeader>
            <Table.ColumnHeader>State</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {peers.map(({id, state, connections, nickname}) =>
            <Table.Row key={id}>
              <Table.Cell>{id}</Table.Cell>
              <Table.Cell>{nickname}</Table.Cell>
              <Table.Cell>{connections}</Table.Cell>
              <Table.Cell>{state}</Table.Cell>
              <Table.Cell>
                <Menu.Root onSelect={({value}) => onSelect(id, value)}>
                  <Menu.Trigger asChild>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </Menu.Trigger>
                  <Portal container={contentRef}>
                    <Menu.Positioner>
                      <Menu.Content>
                        {
                          ['connected', 'connecting'].includes(state) ?
                            <>
                              <Menu.Item
                                value="disconnect"
                                color="fg.error"
                                _hover={{bg: "bg.error", color: "fg.error"}}
                              >
                                Disconnect...
                              </Menu.Item>
                              <Menu.Item value="ping">Ping</Menu.Item>
                            </>
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
    </Show>
  );
};

export default PeerConnectionTable;