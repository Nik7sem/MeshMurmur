import React, {FC} from "react";
import {Status} from "@chakra-ui/react";

const LogLabel: FC<{ type: "error" | "warn" | "info" }> = ({type}) => {
  if (type === "info") {
    return (
      <Status.Root colorPalette="green">
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