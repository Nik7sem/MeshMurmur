import React, {ChangeEvent, FC, RefObject, useState} from 'react';
import {
  Button,
  Center,
  Container,
  createListCollection,
  Field,
  Input,
  Portal,
  Select,
  Table,
  Text
} from "@chakra-ui/react";
import {Tooltip} from "@/components/ui/tooltip.tsx";
import useUserData from "@/hooks/useUserData.tsx";
import {peerConfig} from "@/utils/p2p-library/conf.ts";
import useToast from "@/hooks/useToast.tsx";
import {connector} from "@/init.ts";

interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

const NicknameAssigner: FC<Props> = ({contentRef}) => {
  const {successToast} = useToast()
  const {userData, setUserData} = useUserData()
  const [inputValue, setInputValue] = useState(userData.nickname);
  const [invalid, setInvalid] = useState<boolean>(false);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setInvalid(false);
  }

  function onSave() {
    if (inputValue.length === 0 ||
      inputValue.length > peerConfig.maxNameLength) return setInvalid(true);
    setUserData({...userData, nickname: inputValue});
    successToast('Nickname saved!');
  }

  const peerCollection = createListCollection({
    items: connector.connectedPeers.map(conn => ({
      label: `${conn.targetPeerId.slice(0, 6)}…${conn.targetPeerId.slice(-4)}`,
      value: conn.targetPeerId
    }))
  })

  return (
    <Container>
      <Field.Root orientation="horizontal" invalid={invalid}>
        <Field.Label>Nickname</Field.Label>
        <Input placeholder="Empty nickname" value={inputValue} onChange={onChange}/>
        <Tooltip content="This is the tooltip content">
          <Button ml='5px' onClick={onSave} variant="outline" size="sm">
            Save
          </Button>
        </Tooltip>
        <Field.ErrorText>Nickname is too big!</Field.ErrorText>
      </Field.Root>
      <Center mt="5px">
        <Text textStyle="2xl">Associated nicknames</Text>
      </Center>
      <Table.Root mt='10px' size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Peer Id</Table.ColumnHeader>
            <Table.ColumnHeader>Nickname</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Object.entries(userData.associatedNicknames).map(([peerId, nickname], idx) => (
            <Table.Row key={idx}>
              <Table.Cell>{peerId}</Table.Cell>
              <Table.Cell>{nickname}</Table.Cell>
            </Table.Row>
          ))}
          <Table.Row>
            <Table.Cell>
              <Select.Root collection={peerCollection} size="sm" width="320px">
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
            <Table.Cell>NICKNAME</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Container>
  );
};

export default NicknameAssigner;