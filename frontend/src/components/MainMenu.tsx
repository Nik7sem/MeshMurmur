import React, {useRef, useState} from 'react';
import {
  Drawer,
  Button,
  Portal,
  CloseButton,
  SegmentGroup
} from "@chakra-ui/react";
import PeerSettings from "@/components/PeerSettings/PeerSettings.tsx";
import PeerGraph from "./PeerGraph.tsx"
import NicknameAssigner from "@/components/NicknameAssigner/NicknameAssigner.tsx";
import Experimental from "@/components/Experimental.tsx";
import Logs from "@/components/Logs.tsx";

const MainMenu = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [menuValue, setMenuValue] = useState<string>('Logs');
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <Drawer.Root size="xl" open={isOpen} onOpenChange={(e) => {
      setIsOpen(e.open)
      setMenuValue('Logs')
    }}>
      <Drawer.Trigger asChild>
        <Button variant="outline" size="sm" paddingY="3">
          {isOpen ? "Hide ▲" : "Show ▼"}
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop/>
        <Drawer.Positioner>
          <Drawer.Content ref={contentRef}>
            <Drawer.Header>
              <Drawer.Title>
                <SegmentGroup.Root value={menuValue}
                                   onValueChange={({value}) => value ? setMenuValue(value) : undefined}>
                  <SegmentGroup.Indicator/>
                  <SegmentGroup.Items items={["Logs", "Settings", "Nickname", "Graph", "Experimental"]}/>
                </SegmentGroup.Root>
              </Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              {menuValue === "Logs" ? (
                <Logs/>
              ) : menuValue === "Settings" ? (
                <PeerSettings contentRef={contentRef}/>
              ) : menuValue === "Graph" ? (
                <PeerGraph/>
              ) : menuValue === "Nickname" ? (
                <NicknameAssigner contentRef={contentRef}/>
              ) : menuValue === "Experimental" ? (
                <Experimental/>
              ) : <></>}
            </Drawer.Body>
            {/*<Drawer.Footer>*/}
            {/*  <Button variant="outline">Cancel</Button>*/}
            {/*  <Button>Save</Button>*/}
            {/*</Drawer.Footer>*/}
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm"/>
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export default MainMenu;