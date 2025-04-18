import React, {FC, ReactNode} from 'react';
import {Tooltip} from "@/components/ui/tooltip.tsx";

interface Props {
  peerId: string;
  children: ReactNode;
}

const TooltipPeerId: FC<Props> = ({peerId, children}) => {
  return (
    <Tooltip content={peerId} showArrow positioning={{placement: "bottom"}} openDelay={300} closeDelay={100}
             interactive>
      {children}
    </Tooltip>
  );
};

export default TooltipPeerId;