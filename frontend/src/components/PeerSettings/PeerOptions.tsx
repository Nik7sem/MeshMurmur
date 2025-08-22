import React, {FC, RefObject} from 'react';
import {Box, Checkbox, createListCollection, ListCollection, Portal, Select} from "@chakra-ui/react";
import useUserData from "@/hooks/useUserData.tsx";
import {signalerNameType} from "@/utils/p2p-library/types.ts";

const signalers: ListCollection<{ label: signalerNameType, value: signalerNameType }> = createListCollection({
  items: [
    {label: "FirebaseSignaler", value: "FirebaseSignaler"},
    {label: "WebsocketSignalerBipki", value: "WebsocketSignalerBipki"},
    {label: "WebsocketSignalerDev", value: "WebsocketSignalerDev"},
  ],
})

interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

const PeerOptions: FC<Props> = ({contentRef}) => {
  const {userData, setUserData} = useUserData()

  function onValue(selected: signalerNameType) {
    setUserData({...userData, signaler: selected})
  }

  return (
    <Box mt="10px">
      <Checkbox.Root
        mt="10px"
        checked={userData.autoconnect}
        onCheckedChange={(e) => setUserData({...userData, autoconnect: !!e.checked})}
      >
        <Checkbox.HiddenInput/>
        <Checkbox.Control/>
        <Checkbox.Label>Autoconnect</Checkbox.Label>
      </Checkbox.Root>
      <Select.Root mt="10px" collection={signalers} size="sm" width="320px" value={[userData.signaler]}
                   onValueChange={(e) => onValue((e.value as signalerNameType[])[0])}>
        <Select.HiddenSelect/>
        <Select.Label>Select signaler</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select framework"/>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator/>
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal container={contentRef}>
          <Select.Positioner>
            <Select.Content>
              {signalers.items.map((signaler) => (
                <Select.Item item={signaler} key={signaler.value}>
                  {signaler.label}
                  <Select.ItemIndicator/>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Box>
  );
};

export default PeerOptions;