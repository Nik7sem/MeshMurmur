import React, {FC, RefObject} from 'react';
import {Container,} from "@chakra-ui/react";
import OwnNickname from "@/components/NicknameAssigner/OwnNickname.tsx";
import AssociatedNicknames from "@/components/NicknameAssigner/AssociatedNicknames.tsx";

interface Props {
  contentRef: RefObject<HTMLElement | null>;
}

const NicknameAssigner: FC<Props> = ({contentRef}) => {
  return (
    <Container>
      <OwnNickname/>
      <AssociatedNicknames contentRef={contentRef}/>
    </Container>
  );
};

export default NicknameAssigner;