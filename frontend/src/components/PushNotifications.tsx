import React, {useEffect, useState} from 'react';
import {Alert, Button, Container, Field, Input, Text} from "@chakra-ui/react";

const PushNotifications = () => {
  const [myToken, setMyToken] = useState("");
  const [calleeToken, setCalleeToken] = useState("");

  useEffect(() => {
    setMyToken("NO TOKEN")
  }, [])

  function onClick() {
    setCalleeToken("NOTHING TO DO")
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
    </Container>
  );
};

export default PushNotifications;