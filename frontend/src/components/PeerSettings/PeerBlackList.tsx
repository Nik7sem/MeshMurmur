import React from 'react';
import {VStack, Text, Show} from "@chakra-ui/react";
import {connector} from "@/init.ts";

const PeerBlackList = () => {
  return (
    <Show when={connector.blackList.size > 0} fallback={<Text>Empty</Text>}>
      <VStack>
        {Array.from(connector.blackList).map((targetPeerId) => <Text>{targetPeerId}</Text>)}
      </VStack>
    </Show>
  );
};

export default PeerBlackList;