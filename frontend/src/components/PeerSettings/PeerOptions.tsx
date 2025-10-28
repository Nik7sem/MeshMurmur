import React, {FC, RefObject} from 'react';
import {Checkbox, createListCollection, Flex, ListCollection, Portal, Select} from "@chakra-ui/react";
import useUserData from "@/hooks/useUserData.tsx";
import {signalerNameType} from "@p2p-library/types.ts";

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
    setUserData({...userData, connectorConfig: {...userData.connectorConfig, signaler: selected}})
  }

  return (
    <Flex mt="10px" direction='column'>
      <Checkbox.Root
        mt="10px"
        checked={userData.connectorConfig.autoconnect}
        onCheckedChange={(e) => setUserData({
          ...userData,
          connectorConfig: {...userData.connectorConfig, autoconnect: !!e.checked}
        })}
      >
        <Checkbox.HiddenInput/>
        <Checkbox.Control/>
        <Checkbox.Label>Autoconnect</Checkbox.Label>
      </Checkbox.Root>
      <Checkbox.Root
        mt="10px"
        checked={userData.connectorConfig.autoreconnect}
        onCheckedChange={(e) => setUserData({
          ...userData,
          connectorConfig: {...userData.connectorConfig, autoreconnect: !!e.checked}
        })}
      >
        <Checkbox.HiddenInput/>
        <Checkbox.Control/>
        <Checkbox.Label>Autoreconnect</Checkbox.Label>
      </Checkbox.Root>
      <Select.Root mt="10px" collection={signalers} size="sm" width="320px" value={[userData.connectorConfig.signaler]}
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
    </Flex>
  );
};

export default PeerOptions;