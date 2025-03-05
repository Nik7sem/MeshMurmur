import React from 'react';
import {Box} from "@chakra-ui/react";
import {ColorModeButton} from "@/components/ui/color-mode.tsx";

const Header = () => {
  return (
    <Box position="absolute">
      <ColorModeButton/>
    </Box>
  );
};

export default Header;