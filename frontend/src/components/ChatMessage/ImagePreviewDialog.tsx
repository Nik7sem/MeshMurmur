// components/ImagePreviewDialog.tsx
import React from 'react';
import {
  Dialog,
  Portal,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogBody,
  DialogCloseTrigger,
  CloseButton,
  useDisclosure,
  Image,
} from '@chakra-ui/react';

interface Props {
  src: string;
  alt: string;
  trigger: (onOpen: () => void) => React.ReactNode;
}

const ImagePreviewDialog: React.FC<Props> = ({src, alt, trigger}) => {
  const {open, onOpen, onClose} = useDisclosure();

  return (
    <>
      {trigger(onOpen)}

      {open && (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open ? onClose() : null} size="full">
          <Portal>
            <DialogBackdrop/>
            <DialogPositioner>
              <DialogContent>
                <DialogCloseTrigger asChild>
                  <CloseButton position="absolute" top={4} right={4} zIndex={1}/>
                </DialogCloseTrigger>
                <DialogBody p={0}>
                  <Image
                    src={src}
                    alt={alt}
                    w="100%"
                    maxH="90vh"
                    objectFit="contain"
                    borderRadius="md"
                  />
                </DialogBody>
              </DialogContent>
            </DialogPositioner>
          </Portal>
        </Dialog.Root>
      )}
    </>
  );
};

export default ImagePreviewDialog;
