import React from 'react';
import {DataList} from "@chakra-ui/react";
import {AppVersion, peerId} from "@/init.ts";

const PeerInfo = () => {
  return (
    <DataList.Root marginLeft="20px" orientation="horizontal" maxW="15">
      <DataList.Item>
        <DataList.ItemLabel>App version</DataList.ItemLabel>
        <DataList.ItemValue>{AppVersion}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>PeerId</DataList.ItemLabel>
        <DataList.ItemValue>{peerId}</DataList.ItemValue>
      </DataList.Item>
    </DataList.Root>
  );
};

export default PeerInfo;