import React, {FC, RefObject} from 'react';
import {Center, Container, DataList, Separator, Text} from "@chakra-ui/react";
import {AppVersion, peerId} from "@/init.ts";
import PeerConnectionOptions from "@/components/PeerSettings/PeerConnectionOptions.tsx";

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
    </Container>
  );
};

export default PeerInfo;