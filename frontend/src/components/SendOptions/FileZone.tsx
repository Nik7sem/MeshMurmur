import React, {FC, useEffect} from 'react';
import {Box, FileUpload, Icon, useFileUploadContext} from "@chakra-ui/react";
import {LuUpload} from "react-icons/lu";

interface Props {
  uploadedFiles: File[];
}

const FileZone: FC<Props> = ({uploadedFiles}) => {
  const fileUpload = useFileUploadContext()

  useEffect(() => {
    fileUpload.setFiles(uploadedFiles)
  }, []);

  return (
    <FileUpload.Dropzone onPaste={(e) => fileUpload.setFiles([...e.clipboardData.files])}>
      <Icon size="md" color="fg.muted">
        <LuUpload/>
      </Icon>
      <FileUpload.DropzoneContent>
        <Box>Drag and drop files here</Box>
        <Box color="fg.muted">files up to 5MB</Box>
      </FileUpload.DropzoneContent>
    </FileUpload.Dropzone>
  );
};

export default FileZone;