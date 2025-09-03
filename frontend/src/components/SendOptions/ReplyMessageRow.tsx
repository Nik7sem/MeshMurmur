import React, {FC} from 'react';
import {Box, Flex, GridItem, Icon, IconButton, Presence, Text} from "@chakra-ui/react";
import {FaReply} from "react-icons/fa";
import {peerId} from "@/init.ts";
import {getReplyText} from "@/utils/getReplyText.ts";
import {MdOutlineCancel} from "react-icons/md";
import {completeMessageType} from "@/utils/p2p-library/types.ts";

interface Props {
  replyMessage: completeMessageType | null
  resetReplyMessage: () => void
}

const ReplyMessageRow: FC<Props> = ({replyMessage, resetReplyMessage}) => {
  return (
    <Presence width='100%'
              p='0'
              m='0'
              present={!!replyMessage}
              animationName={{_open: "fade-in", _closed: "fade-out"}}
              animationDuration="moderate"
              gridColumn="1 / -1"
              display={replyMessage ? "grid" : "none"}
              gridTemplateColumns="subgrid"
              alignItems="start">
      <GridItem as={Flex} justifyContent='center' alignItems='center' height='100%'>
        <Flex width='40px' height='40px' justifyContent='center' alignItems='center'>
          <Icon size="lg" color="pink.700">
            <FaReply/>
          </Icon>
        </Flex>
      </GridItem>
      <GridItem as={Flex} alignItems='center'>
        <Flex p='8px 12px 8px 12px' direction="column" alignItems='flex-start' fontSize='xs' color='gray.300'>
          {
            replyMessage ?
              <>
                <Text>Reply to: {replyMessage.peerId === peerId ? 'me' : replyMessage.nickname}</Text>
                <Text whiteSpace='nowrap' textOverflow='ellipsis' overflow='hidden' maxWidth='60vw'>{getReplyText(replyMessage)}</Text>
              </> : <></>
          }
        </Flex>
      </GridItem>
      <GridItem as={Flex} justifyContent='center' alignItems='center' height='100%'>
        <Box width='40px' height='40px'>
          <IconButton aria-label="Cancel reply" color='white.700' onClick={() => resetReplyMessage()}>
            <MdOutlineCancel/>
          </IconButton>
        </Box>
      </GridItem>
    </Presence>
  );
};

export default ReplyMessageRow;