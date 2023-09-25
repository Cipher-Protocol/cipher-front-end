import { Box, ButtonGroup, Flex, Heading, Spacer } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";
import Btn from "./btn";

export default function Header() {
  return (
    <Flex w="full" alignItems="center" gap="2" p="4">
      <Box p="2">
        <Heading size="md">Chakra App</Heading>
      </Box>
      <Spacer />
      <ButtonGroup gap="2">
        <Btn colorScheme="teal">Integration</Btn>
        <Btn colorScheme="teal">Docs</Btn>
      </ButtonGroup>
      <ConnectButton />
    </Flex>
  );
}
