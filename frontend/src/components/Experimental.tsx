import React, {useEffect, useState} from 'react';
import {Alert, Button, Checkbox, Container, Field, Input, Separator, Text} from "@chakra-ui/react";
import RTCConfigurationChanger from "@/components/RTCConfigurationChanger.tsx";

const Experimental = () => {
  const [myToken, setMyToken] = useState("");
  const [calleeToken, setCalleeToken] = useState("");
  const [anonymous, setAnonymous] = useState(() => !!localStorage.getItem("anonymous"))

  useEffect(() => {
    setMyToken("NO TOKEN")
  }, [])

  function onClick() {
    setCalleeToken("NOTHING TO DO")
  }

  function onChange(val: boolean) {
    if (val) {
      localStorage.setItem("anonymous", "true");
    } else {
      localStorage.removeItem("anonymous");
    }

    setAnonymous(val)
  }

  return (
    <Container>
      <Alert.Root status="warning">
        <Alert.Indicator/>
        <Alert.Title>
          This section is experimental, please be careful... I warn you...
        </Alert.Title>
      </Alert.Root>

      <Text mt="10px">Token</Text>
      <Text>{myToken}</Text>

      <Field.Root mt="10px" required>
        <Field.Label>
          Callee token <Field.RequiredIndicator/>
        </Field.Label>
        <Input value={calleeToken} onChange={(e) => setCalleeToken(e.target.value)}/>
        <Field.HelperText>Token of the user you want to send the notification to</Field.HelperText>
      </Field.Root>
      <Button mt="10px" onClick={onClick}>Subscribe</Button>
      <Separator mt="10px"/>
      <Checkbox.Root
        mt="10px"
        checked={anonymous}
        onCheckedChange={(e) => onChange(!!e.checked)}
      >
        <Checkbox.HiddenInput/>
        <Checkbox.Control/>
        <Checkbox.Label>Make anonymous</Checkbox.Label>
      </Checkbox.Root>
      <Separator mt="10px"/>
      <RTCConfigurationChanger/>
    </Container>
  );
};

export default Experimental;