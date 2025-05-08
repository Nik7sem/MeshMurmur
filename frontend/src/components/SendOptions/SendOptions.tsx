import React, {ChangeEvent, FC, KeyboardEvent, useState} from 'react';
import {Button, FileUpload, Menu, Portal, Input, Center} from "@chakra-ui/react";
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

  function onChangeInput(e: ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    connector.actions.emitTypingEvent()
  }

  function keyDownHandler(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClick()
    }
  }

  function onClick() {
    if (inputValue.length > 0) {
      connector.actions.sendText(inputValue)
      addMessage({data: inputValue, peerId, nickname: ''})
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
      <Input onKeyDown={keyDownHandler} value={inputValue} onInput={onChangeInput}/>
      <Button marginLeft='5' onClick={onClick} aria-label="Send message">
        <LuSend/>
      </Button>
    </Center>
  );
};

export default SendOptions;