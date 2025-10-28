import React, {ChangeEvent, FC, RefObject, useState} from 'react';
import {
  Button,
  Center, CloseButton,
  Container,
  createListCollection,
  Input,
  Portal,
  Select,
  Table,
  Text
} from "@chakra-ui/react";
import useToast from "@/hooks/useToast.tsx";
import useUserData from "@/hooks/useUserData.tsx";
import {connector} from "@/init.ts";
import {AppConfig} from "@p2p-library/conf.ts";
import TooltipPeerId from "@/components/TooltipPeerId.tsx";

interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

function getCompressedPeerId(peerId: string): string {
  return `${peerId.slice(0, 10)}…${peerId.slice(-10)}`
}

const AssociatedNicknames: FC<Props> = ({contentRef}) => {
  const {successToast, errorToast} = useToast()
  const {userData, setUserData} = useUserData()
  const [selectedPeerId, setSelectedPeerId] = useState<string[]>([])
  const [nickname, setNickname] = useState<string>("")

  const peerIds: string[] = [...new Set([
    ...connector.connectedPeers.map(conn => conn.targetPeerId),
    ...Object.keys(connector.actions.associatedNicknames)
  ])]

  const peerCollection = createListCollection({
    items: peerIds.map(targetPeerId => ({
      label: getCompressedPeerId(targetPeerId),
      value: targetPeerId
    }))
  })

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    setNickname(e.target.value);
  }

  function onRemove(peerId: string) {
    const associatedNicknames = {...userData.associatedNicknames}
    delete associatedNicknames[peerId]
    setUserData({...userData, associatedNicknames})
  }

  function onClear() {
    setSelectedPeerId([])
    setNickname('')
  }

  function onClick() {
    if (!nickname || selectedPeerId.length === 0 || !selectedPeerId[0]) return;
    if (nickname.length > AppConfig.maxNameLength) return errorToast('Nickname is too long!');

    const associatedNicknames = {...userData.associatedNicknames}
    associatedNicknames[selectedPeerId[0]] = nickname
    setUserData({...userData, associatedNicknames})
    setSelectedPeerId([])
    setNickname('')
    successToast("Nickname successfully saved!")
  }

  return (
    <Container p='0' m='0'>
      <Center mt="5px">
        <Text textStyle="2xl">Associated nicknames</Text>
      </Center>
      <Table.Root mt='10px' size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Peer Id</Table.ColumnHeader>
            <Table.ColumnHeader>Nickname</Table.ColumnHeader>
            <Table.ColumnHeader></Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Object.entries(userData.associatedNicknames).map(([peerId, nickname], idx) => (
            <Table.Row key={idx}>
              <TooltipPeerId peerId={peerId}>
                <Table.Cell>{getCompressedPeerId(peerId)}</Table.Cell>
              </TooltipPeerId>
              <Table.Cell>{nickname}</Table.Cell>
              <Table.Cell>
                <CloseButton onClick={() => onRemove(peerId)}/>
              </Table.Cell>
            </Table.Row>
          ))}
          <Table.Row>
            <Table.Cell>
              <Select.Root collection={peerCollection} size="sm" value={selectedPeerId}
                           onValueChange={(e) => setSelectedPeerId(e.value)}>
                <Select.HiddenSelect/>
                {/*<Select.Label>Select peer Id</Select.Label>*/}
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select peer Id"/>
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator/>
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal container={contentRef}>
                  <Select.Positioner>
                    <Select.Content>
                      {peerCollection.items.map(({label, value}) => (
                        <Select.Item item={value} key={value}>
                          {label}
                          <Select.ItemIndicator/>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Table.Cell>
            <Table.Cell>
              <Input placeholder="Empty nickname" value={nickname} onChange={onChange}/>
            </Table.Cell>
            <Table.Cell>
              <CloseButton onClick={onClear}/>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
      <Button onClick={onClick}>Submit</Button>
    </Container>
  );
};

export default AssociatedNicknames;