import React from 'react';
import {Checkbox} from "@chakra-ui/react";
import useUserData from "@/hooks/useUserData.tsx";

const PeerOptions = () => {
  const {userData, setUserData} = useUserData()

  return (
    <Checkbox.Root
      mt="10px"
      checked={userData.autoconnect}
      onCheckedChange={(e) => setUserData({...userData, autoconnect: !!e.checked})}
    >
      <Checkbox.HiddenInput/>
      <Checkbox.Control/>
      <Checkbox.Label>Autoconnect</Checkbox.Label>
    </Checkbox.Root>
  );
};

export default PeerOptions;