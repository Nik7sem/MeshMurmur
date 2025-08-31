import React, {ChangeEvent, FC, KeyboardEvent, useRef, useState} from 'react';
import {Button, FileUpload, Menu, Portal, Center, Textarea} from "@chakra-ui/react";
import {GrAttachment} from "react-icons/gr";
import {LuSend} from "react-icons/lu";
import {connector, peerId} from "@/init.ts";
import {completeMessageType} from "@/utils/p2p-library/types.ts";
import FileZone from "@/components/SendOptions/FileZone.tsx";

interface Props {
  addMessage: (data: completeMessageType) => void;
}

const SendOptions: FC<Props> = ({addMessage}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [inputValue, setInputValue] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function onChangeInput(e: ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value)
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
    connector.actions.emitTypingEvent()
  }

  function keyDownHandler(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onClick()
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px'
      }
    }
  }

  function onClick() {
    const trimmed = inputValue.trim();
    if (trimmed.length > 0) {
      connector.actions.sendText(trimmed)
      addMessage({data: trimmed, peerId, nickname: ''})
      setInputValue('')
    }

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        connector.actions.sendFile(file).then(() => {
          const url = URL.createObjectURL(file)
          addMessage({data: {url, fileName: file.name, fileSize: file.size, fileType: file.type}, peerId, nickname: ''})
        })
      }
      setUploadedFiles([])
    }
  }

  return (
    <Center marginTop="1vh">
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button color="white" bg="black" marginRight='5' aria-label="Send message">
            <GrAttachment/>
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <FileUpload.Root maxW="xl" alignItems="stretch" maxFiles={5}
                               onFileAccept={(e) => setUploadedFiles(e.files)}>
                <FileUpload.HiddenInput/>
                <FileZone uploadedFiles={uploadedFiles}/>
                <FileUpload.List showSize clearable/>
              </FileUpload.Root>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <Textarea
        ref={textareaRef}
        onKeyDown={keyDownHandler}
        value={inputValue}
        onInput={onChangeInput}
        placeholder="Message"
        resize="none"
        rows={1}
        minH="40px"
        maxH="100px"
        overflowY="auto"
        whiteSpace="pre-wrap"
      />
      <Button marginLeft='5' onClick={onClick} aria-label="Send message">
        <LuSend/>
      </Button>
    </Center>
  );
};

export default SendOptions;