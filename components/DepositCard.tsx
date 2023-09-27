import React from "react";
import SelectorBox from "./SelectorBox";
import { Flex } from "@chakra-ui/react";
import PublicInput from "./PublicInput";

export default function DepositCard() {
  return (
    <Flex className="p-8 w-full flex flex-row justify-center items-center gap-8">
      <PublicInput />
      <SelectorBox />
    </Flex>
  );
}
