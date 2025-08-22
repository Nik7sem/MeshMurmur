import React from 'react';
import {Box, Text} from "@chakra-ui/react";
import {AppVersion} from "@/init.ts";

const VersionText = () => {
  return (
    <Box position="absolute" bottom="5px" left="10px">
      <Text fontSize={10} fontWeight="bold">{AppVersion}</Text>
    </Box>
  );
};

export default VersionText;