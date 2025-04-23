import React from 'react';
import {VStack, Text} from "@chakra-ui/react";
import {connector} from "@/init.ts";

const PeerBlackList = () => {
  return (
    connector.blackList.size > 0 ?
      <VStack>
        {Array.from(connector.blackList).map((targetPeerId) => <Text>{targetPeerId}</Text>)}
      </VStack> :
      <Text>Empty</Text>
  );
};

export default PeerBlackList;