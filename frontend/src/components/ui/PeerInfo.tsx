import React from 'react';
import {DataList} from "@chakra-ui/react";
import {connector, peerId} from "@/init.ts";

const PeerInfo = () => {
  return (
    <DataList.Root marginLeft="40px" orientation="horizontal" maxW="5">
      <DataList.Item>
        <DataList.ItemLabel>PeerId</DataList.ItemLabel>
        <DataList.ItemValue>{peerId}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Potential peers</DataList.ItemLabel>
        <DataList.ItemValue>{connector.potentialPeersCount}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Connecting peers</DataList.ItemLabel>
        <DataList.ItemValue>{connector.connectingPeersCount}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Connected peers</DataList.ItemLabel>
        <DataList.ItemValue>{connector.peers.length}</DataList.ItemValue>
      </DataList.Item>
    </DataList.Root>
  );
};

export default PeerInfo;