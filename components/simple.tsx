import { Flex, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { useState } from "react";
import DepositCard from "./DepositCard";
import WithdrawCard from "./WithdrawCard";
import { SimpleType } from "@/type.d";

export default function Simple() {
  const [simpleType, setSimpleType] = useState(SimpleType.DEPOSIT);

  return (
    <Flex className="w-[90%] m-auto flex-1 flex flex-col items-center">
      <Tabs
        variant="soft-rounded"
        colorScheme="green"
        className="rounded-full border-2 border-green-500"
        onChange={(index) => setSimpleType(index)}
      >
        <TabList>
          <Tab className="w-32">Deposit</Tab>
          <Tab className="w-32">Withdraw</Tab>
        </TabList>
      </Tabs>
      {simpleType === SimpleType.DEPOSIT ? <DepositCard /> : <WithdrawCard />}
    </Flex>
  );
}
