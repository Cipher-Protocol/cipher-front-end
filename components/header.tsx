import { Box, ButtonGroup, Flex, Heading, Spacer } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";
import Btn from "./Btn";

export default function Header() {
  return (
    <Flex className="w-full p-4 gap-2 items-center">
      <Box className="p-2">
        <Heading size="md">Chakra App</Heading>
      </Box>
      <Spacer />
      <ButtonGroup className="gap-2">
        <Btn colorScheme="teal" className="w-32">
          Integration
        </Btn>
        <Btn colorScheme="teal" className="w-32">
          Docs
        </Btn>
      </ButtonGroup>
      <ConnectButton />
    </Flex>
  );
}
