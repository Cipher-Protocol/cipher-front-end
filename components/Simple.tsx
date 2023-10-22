import { Flex, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import DepositCard from "./DepositCard";
import WithdrawCard from "./WithdrawCard";
import { SimpleType, TokenConfig } from "../type.d";
import { useNetwork } from "wagmi";
import { getTokenConfig } from "../lib/getTokenConfig";

export default function Simple() {
  const { chain } = useNetwork();
  const [tokens, setTokens] = useState<TokenConfig[]>(getTokenConfig(1));
  const [simpleType, setSimpleType] = useState(SimpleType.DEPOSIT);

  useEffect(() => {
    const tokens = getTokenConfig(chain?.id || 1);
    setTokens(tokens);
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
        <DepositCard tokens={tokens} />
      ) : (
        <WithdrawCard tokens={tokens} />
      )}
    </Flex>
  );
}
