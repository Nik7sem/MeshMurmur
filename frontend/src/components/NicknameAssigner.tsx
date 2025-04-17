import React, {ChangeEvent, useState} from 'react';
import {Button, Center, Container, Field, Input, Table, Text} from "@chakra-ui/react";
import {Tooltip} from "@/components/ui/tooltip.tsx";
import useUserData from "@/hooks/useUserData.tsx";
import {peerConfig} from "@/utils/p2p-library/conf.ts";
import useToast from "@/hooks/useToast.tsx";

const NicknameAssigner = () => {
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
      <Table.Root m='10px' size="md">
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

        </Table.Body>
      </Table.Root>

    </Container>
  );
};

export default NicknameAssigner;