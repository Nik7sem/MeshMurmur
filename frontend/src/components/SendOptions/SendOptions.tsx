import React, {FC} from 'react';
import {Grid,} from "@chakra-ui/react";
import {connector, peerId} from "@/init.ts";
import {completeMessageType} from "@/utils/p2p-library/types.ts";
import ReplyMessageRow from "@/components/SendOptions/ReplyMessageRow.tsx";
import SendMessageRow from "@/components/SendOptions/SendMessageRow.tsx";
import {getReplyText} from "@/utils/getReplyText.ts";

interface Props {
  addMessage: (data: completeMessageType) => void
  replyMessage: completeMessageType | null
  resetReplyMessage: () => void
}

const SendOptions: FC<Props> = ({addMessage, replyMessage, resetReplyMessage}) => {
  function sendMessage(inputValue: string, uploadedFiles: File[]) {
    let trimmed = inputValue.trim();
    if (trimmed.length > 0) {
      if (replyMessage) {
        trimmed = `Reply "${getReplyText(replyMessage)}": ${trimmed}`
        resetReplyMessage()
      }
      connector.actions.sendText(trimmed)
      addMessage({data: trimmed, peerId, nickname: ''})
    }

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        connector.actions.sendFile(file).then(() => {
          const url = URL.createObjectURL(file)
          addMessage({data: {url, fileName: file.name, fileSize: file.size, fileType: file.type}, peerId, nickname: ''})
        })
      }
    }
  }

  return (
    <Grid
      templateColumns="auto 1fr auto"
      templateRows={replyMessage ? "auto auto" : "auto"}
      gap={0}
      width="min(100%, 700px)"
      m='0 auto 0 auto'
    >
      <ReplyMessageRow replyMessage={replyMessage} resetReplyMessage={resetReplyMessage}/>
      <SendMessageRow sendMessage={sendMessage}/>
    </Grid>
  );
};

export default SendOptions;