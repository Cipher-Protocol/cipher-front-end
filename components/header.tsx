import { Box, ButtonGroup, Flex, Heading, Spacer } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";
import Btn from "./Btn";

export default function Header() {
  return (
    <Flex w="full" align="center" gap="2" p="4">
      <Box p="2">
        <Heading size="md">Chakra App</Heading>
      </Box>
      <Spacer />
      <ButtonGroup gap="2">
        <Btn colorScheme="teal" w={"8rem"}>
          Integration
        </Btn>
        <Btn colorScheme="teal" w={"8rem"}>
          Docs
        </Btn>
      </ButtonGroup>
      <ConnectButton />
    </Flex>
  );
}
