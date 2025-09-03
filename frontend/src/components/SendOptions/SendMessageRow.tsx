import React, {ChangeEvent, ClipboardEvent, FC, KeyboardEvent, useState} from 'react';
import {Box, FileUpload, Flex, GridItem, IconButton, Menu, Portal, Textarea} from "@chakra-ui/react";
import {GrAttachment} from "react-icons/gr";
import FileZone from "@/components/SendOptions/FileZone.tsx";
import {IoSendSharp} from "react-icons/io5";
import {connector} from "@/init.ts";

interface Props {
  sendMessage: (inputValue: string, uploadedFiles: File[]) => void
}

const SendMessageRow: FC<Props> = ({sendMessage}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [inputValue, setInputValue] = useState<string>('')
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  function onChangeInput(e: ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value)
    connector.actions.emitTypingEvent()
  }

  function keyDownHandler(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onClick()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const clipboardData = e.clipboardData

    if (clipboardData.files.length > 0) {
      e.preventDefault()

      const pastedFiles = Array.from(clipboardData.files);
      // const validFiles = pastedFiles.filter(file => file.type.startsWith('image/'))

      if (pastedFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...pastedFiles])
        setMenuOpen(true)
      }
    }
  }

  function onClick() {
    sendMessage(inputValue, uploadedFiles)
    setInputValue('')
    setUploadedFiles([])
  }

  return (
    <>
      <GridItem as={Flex} justifyContent='center' alignItems='flex-end' height='100%'>
        <Box width='40px' height='40px'>
          <Menu.Root open={menuOpen} onOpenChange={e => setMenuOpen(e.open)}>
            <Menu.Trigger asChild>
              <IconButton aria-label="attach">
                <GrAttachment/>
              </IconButton>
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
        </Box>
      </GridItem>
      <GridItem as={Flex} justifyContent='center' alignItems='center'>
        <Textarea
          m='0'
          p='8px 12px 8px 12px'
          autoresize
          name="textarea"
          border='none'
          outline='none'
          overflow='hidden'
          onKeyDown={keyDownHandler}
          value={inputValue}
          onInput={onChangeInput}
          onPaste={handlePaste}
          placeholder="Message"
          resize="none"
          rows={1}
          minH="40px"
          maxH="80px"
          overflowY="auto"
          whiteSpace="pre-wrap"
        />
      </GridItem>
      <GridItem as={Flex} justifyContent='center' alignItems='flex-end' height='100%'>
        <Box width='40px' height='40px'>
          <IconButton onClick={onClick} aria-label="Send message">
            <IoSendSharp/>
          </IconButton>
        </Box>
      </GridItem>
    </>
  );
};

export default SendMessageRow;