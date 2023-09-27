import { Flex, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { useState } from "react";
import DepositCard from "./DepositCard";
import WithdrawCard from "./WithdrawCard";
import { SimpleType } from "@/type";

export default function Simple() {
  const [simpleType, setSimpleType] = useState(SimpleType.DEPOSIT);

  return (
    <Flex w="90%" m="auto" flex={1} align={"center"} flexDirection={"column"}>
      <Tabs
        variant="soft-rounded"
        colorScheme="green"
        // p={"0.5rem"}
        border={"3px solid #38A169"}
        borderRadius="full"
        onChange={(index) => setSimpleType(index)}
      >
        <TabList>
          <Tab w={"8rem"}>Deposit</Tab>
          <Tab w={"8rem"}>Withdraw</Tab>
        </TabList>
      </Tabs>
      {simpleType === SimpleType.DEPOSIT ? <DepositCard /> : <WithdrawCard />}
    </Flex>
  );
}
