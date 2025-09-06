import React, {FC} from 'react';
import {Badge, Center, Em} from "@chakra-ui/react";

interface Props {
  nickname: string
  status: string
}

const ChatMemberBadge: FC<Props> = ({nickname, status}) => {
  return (
    <Center m='3px'>
      <Badge><Em>{nickname}</Em> {status} chat</Badge>
    </Center>
  );
};

export default ChatMemberBadge;