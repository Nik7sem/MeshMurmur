import React, {useState} from 'react';
import {Button, Container, HStack, Text, Textarea} from "@chakra-ui/react";
import {MainRTCConfig} from "@/utils/p2p-library/conf.ts";
import useToast from "@/hooks/useToast.tsx";

function prettyStringify(object: object) {
  return JSON.stringify(object, null, '\t')
}

const RtcConfigurationChanger = () => {
  const [stringConfig, setStringConfig] = useState<string>(prettyStringify(MainRTCConfig.get()));
  const [oldStringConfig, setOldStringConfig] = useState<string>(prettyStringify(MainRTCConfig.get()));
  const {successToast, errorToast} = useToast();

  function updateConfigs(config?: RTCConfiguration) {
    const newStringConfig = prettyStringify(config ?? MainRTCConfig.get())
    setOldStringConfig(newStringConfig)
    setStringConfig(newStringConfig)
  }

  function onSave() {
    let config = {}
    try {
      config = JSON.parse(stringConfig)
    } catch (e) {
      console.log(e)
      return errorToast(`Cannot parse configuration`)
    }

    const result = MainRTCConfig.set(config)
    if (result) {
      updateConfigs()
      successToast("Set configuration successfully")
    } else {
      errorToast("Configuration invalid")
    }
  }

  function onRevert() {
    setStringConfig(oldStringConfig)
  }

  function onDefault() {
    updateConfigs(MainRTCConfig.setDefault())
    successToast("Default configuration restored")
  }

  return (
    <Container>
      <Text textAlign='center' m='4px auto 4px auto'>RTC configuration</Text>
      <Textarea whiteSpace="pre-wrap" height='300px'
                value={stringConfig}
                onInput={e => setStringConfig(e.currentTarget.value)}
      />
      <HStack mt='10px'>
        <Button onClick={onSave} disabled={stringConfig === oldStringConfig}>Save</Button>
        <Button onClick={onRevert} disabled={stringConfig === oldStringConfig}>Revert</Button>
        <Button onClick={onDefault}>Default</Button>
      </HStack>
    </Container>
  );
};

export default RtcConfigurationChanger;