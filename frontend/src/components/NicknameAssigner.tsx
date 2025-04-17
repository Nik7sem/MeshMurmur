import React, {ChangeEvent, useState} from 'react';
import {Button, Container, Field, Flex, Input} from "@chakra-ui/react";
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
        <Field.ErrorText>Nickname is too big!</Field.ErrorText>
      </Field.Root>
      <Flex mt='10px' direction="row" alignItems="center">
        <Tooltip content="This is the tooltip content">
          <Button onClick={onSave} variant="outline" size="sm">
            Save
          </Button>
        </Tooltip>
      </Flex>
    </Container>
  );
};

export default NicknameAssigner;