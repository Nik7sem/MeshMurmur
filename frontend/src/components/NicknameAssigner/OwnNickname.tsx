import React, {ChangeEvent, useState} from 'react';
import {Button, Field, Input} from "@chakra-ui/react";
import {AppConfig} from "@/utils/p2p-library/conf.ts";
import useToast from "@/hooks/useToast.tsx";
import useUserData from "@/hooks/useUserData.tsx";

const OwnNickname = () => {
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
      inputValue.length > AppConfig.maxNameLength) return setInvalid(true);
    setUserData({...userData, nickname: inputValue});
    successToast('Nickname saved!');
  }

  return (
    <Field.Root orientation="horizontal" invalid={invalid}>
      <Field.Label>Nickname</Field.Label>
      <Input placeholder="Empty nickname" value={inputValue} onChange={onChange}/>
      <Button ml='5px' onClick={onSave} variant="outline" size="sm">
        Save
      </Button>
      <Field.ErrorText>Nickname is too big!</Field.ErrorText>
    </Field.Root>
  );
};

export default OwnNickname;