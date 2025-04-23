import React, {FC, RefObject} from 'react';
import {Center, Container, DataList, Separator, Text} from "@chakra-ui/react";
import {AppVersion, peerId} from "@/init.ts";
import PeerConnectionOptions from "@/components/PeerSettings/PeerConnectionOptions.tsx";
import PeerBlackList from "@/components/PeerSettings/PeerBlackList.tsx";

interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

const PeerInfo: FC<Props> = ({contentRef}) => {
  return (
    <Container>
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
      <Separator margin="10px"/>
      <Center>
        <Text fontSize="2xl">Peers</Text>
      </Center>
      <PeerConnectionOptions contentRef={contentRef}/>
      <Center margin="15px">
        <Text fontSize="2xl">Block List</Text>
      </Center>
      <PeerBlackList/>
    </Container>
  );
};

export default PeerInfo;