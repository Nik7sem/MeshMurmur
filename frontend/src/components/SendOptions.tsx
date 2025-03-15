import React, {FC} from 'react';
import {Button, FileUpload, Menu, Portal} from "@chakra-ui/react";
import {GrAttachment} from "react-icons/gr";
import {HiUpload} from "react-icons/hi";

interface Props {
  onClick: () => void;
  files: File[];
  setFiles: (files: File[]) => void;
}

const SendOptions: FC<Props> = ({onClick, files, setFiles}) => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button color="white" bg="black" marginRight='5' onClick={onClick} aria-label="Send message">
          <GrAttachment/>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <FileUpload.Root onFileAccept={(e) => setFiles(e.files)}>
              <FileUpload.HiddenInput/>
              <FileUpload.Trigger asChild>
                <Button variant="outline" size="sm">
                  <HiUpload/> Send file
                </Button>
              </FileUpload.Trigger>
              <FileUpload.List files={files} showSize clearable/>
            </FileUpload.Root>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default SendOptions;