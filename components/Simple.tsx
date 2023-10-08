import { Flex, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import DepositCard from "./DepositCard";
import WithdrawCard from "./WithdrawCard";
import { SimpleType } from "../type.d";
import { useNetwork } from "wagmi";
import { useToken } from "../hooks/useToken";

export default function Simple() {
  const { chain } = useNetwork();
  const { tokens, isLoadingTokens, refetchTokens } = useToken(chain?.id || 1);
  const [simpleType, setSimpleType] = useState(SimpleType.DEPOSIT);

  useEffect(() => {
    if (chain) {
      refetchTokens();
    }
  }, [chain]);

  return (
    <Flex className="w-[90%] mx-auto flex-1 flex flex-col items-center my-8">
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
      {simpleType === SimpleType.DEPOSIT ? (
        <DepositCard tokens={tokens} isLoadingTokens={isLoadingTokens} />
      ) : (
        <WithdrawCard tokens={tokens} isLoadingTokens={isLoadingTokens} />
      )}
    </Flex>
  );
}
