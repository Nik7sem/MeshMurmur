import React, {useCallback, useEffect, useState} from 'react';
import {Box, Flex, Heading, Status} from "@chakra-ui/react";
import {ColorModeButton, useColorMode} from "@/components/ui/color-mode.tsx";
import MainMenu from "@/components/MainMenu.tsx";
import {connector} from "@/init.ts";
import {Toaster} from "@/components/ui/toaster"

const Header = () => {
  const {setColorMode} = useColorMode()
  const [numberOfPeers, setNumberOfPeers] = useState(connector.connectedPeers.length)

  const onSystemColorThemeChange = useCallback((event: MediaQueryListEvent) => {
    setColorMode(event.matches ? 'dark' : 'light')
  }, [setColorMode])

  const updatePeers = useCallback(() => {
    setNumberOfPeers(connector.connectedPeers.length)
  }, [])

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onSystemColorThemeChange)
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', onSystemColorThemeChange)
    }
  }, [onSystemColorThemeChange])

  useEffect(() => {
    connector.eventEmitter.on('onPeerConnectionChanged', updatePeers)
    return () => {
      connector.eventEmitter.on('onPeerConnectionChanged', updatePeers)
    }
  }, [updatePeers])

  return (
    <Flex justifyContent="space-between" padding="20px" paddingRight="50px">
      <ColorModeButton alignSelf="start"/>
      <Heading size="3xl">MeshMurmur</Heading>
      <MainMenu/>
      <Box>
        <Status.Root colorPalette="green"><Status.Indicator/>{numberOfPeers}</Status.Root>
      </Box>
      <Toaster/>
    </Flex>
  );
};

export default Header;