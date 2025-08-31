"use client"

import {ChakraProvider, createSystem, defaultConfig, defineConfig} from "@chakra-ui/react";
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

const config = defineConfig({
  globalCss: {
    "*::selection": {
      background: "blue.200",
      color: "black",
    },
    "[data-theme=dark] *::selection": {
      background: "blue.600",
      color: "white",
    },
  },
})

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={createSystem(defaultConfig, config)}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
