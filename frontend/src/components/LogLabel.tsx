import React, {FC} from "react";
import {Status} from "@chakra-ui/react";
import {logType} from "@p2p-library/types.ts"

const LogLabel: FC<{ type: logType["type"] }> = ({type}) => {
  if (type === "success") {
    return (
      <Status.Root colorPalette="green">
        <Status.Indicator/>
        Success
      </Status.Root>
    )
  } else if (type === "info") {
    return (
      <Status.Root colorPalette="white">
        <Status.Indicator/>
        Info
      </Status.Root>
    )
  } else if (type === "warn") {
    return (
      <Status.Root colorPalette="orange">
        <Status.Indicator/>
        Warning
      </Status.Root>
    )
  } else if (type === "error") {
    return (
      <Status.Root colorPalette="red">
        <Status.Indicator/>
        Error
      </Status.Root>
    )
  }
}

export default LogLabel;