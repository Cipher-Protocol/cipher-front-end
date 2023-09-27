import { Flex, Input } from "@chakra-ui/react";
import React from "react";

export default function PublicInput() {
  return (
    <Flex>
      <Input variant="outline" placeholder="Deposit Amount" />
    </Flex>
  );
}
