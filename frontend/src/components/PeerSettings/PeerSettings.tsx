import React, {FC, RefObject} from 'react';
import {Center, Container, Separator, Text} from "@chakra-ui/react";
import PeerConnectionTable from "@/components/PeerSettings/PeerConnectionTable.tsx";
import PeerBlackList from "@/components/PeerSettings/PeerBlackList.tsx";
import PeerOptions from "@/components/PeerSettings/PeerOptions.tsx";
import PeerInfo from "@/components/PeerSettings/PeerInfo.tsx";
import PeerActions from "@/components/PeerSettings/PeerActions.tsx";

interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

const PeerSettings: FC<Props> = ({contentRef}) => {
  return (
    <Container>
      <Center><Text fontSize="2xl" mb='4px'>Info</Text></Center>
      <PeerInfo/>
      <Separator margin="10px"/>

      <Center margin="8px"><Text fontSize="2xl">Options</Text></Center>
      <PeerOptions contentRef={contentRef}/>
      <Separator margin="10px"/>

      <Center margin="8px"><Text fontSize="2xl">Actions</Text></Center>
      <PeerActions/>
      <Separator margin="10px"/>

      <Center><Text fontSize="2xl">Peers</Text></Center>
      <PeerConnectionTable contentRef={contentRef}/>

      <Center margin="15px"><Text fontSize="2xl">Black list</Text></Center>
      <PeerBlackList/>
    </Container>
  );
};

export default PeerSettings;