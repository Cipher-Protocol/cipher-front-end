import React from "react";
import SelectorBox from "./SelectorBox";
import { Flex } from "@chakra-ui/react";
import PublicInput from "./PublicInput";

export default function DepositCard() {
  return (
    <Flex
      w="full"
      p="2rem"
      flexDirection="row"
      // bg="green"
      justify="center"
      align="center"
      gap="4rem"
    >
      <PublicInput />
      <SelectorBox />
    </Flex>
  );
}
