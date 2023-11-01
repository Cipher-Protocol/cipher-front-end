import { Box, Flex, Tab, TabList, Tabs } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import DepositCard from "./DepositCard";
import WithdrawCard from "./WithdrawCard";
import { SimpleType, TokenConfig } from "../../type.d";
import { useNetwork } from "wagmi";
import { getTokenConfig } from "../../lib/getTokenConfig";

export default function BasicContainer() {
  const { chain } = useNetwork();
  const [tokens, setTokens] = useState<TokenConfig[]>(getTokenConfig(1));
  const [simpleType, setSimpleType] = useState(SimpleType.DEPOSIT);

  useEffect(() => {
    const tokens = getTokenConfig(chain?.id || 1);
    setTokens(tokens);
  }, [chain]);

  return (
    <Flex className="w-[90%] h-full mx-auto flex-1 flex flex-col items-center my-10 ">
      <Box
        className="bg-white/20 rounded-3xl px-10 py-12 h-120"
        backdropFilter={"blur(10px)"}
      >
        <Tabs
          variant="soft-rounded"
          borderRadius="full"
          className="bg-white/20 p-1 w-80 m-auto"
          onChange={(index) => setSimpleType(index)}
        >
          <TabList>
            <Tab
              _hover={{ bg: "whiteAlpha.400" }}
              _selected={{ bg: "white", textColor: "#6B39AB" }}
              textColor="white"
              className="w-40"
            >
              Deposit
            </Tab>
            <Tab
              _hover={{ bg: "whiteAlpha.400" }}
              _selected={{ bg: "white", textColor: "#6B39AB" }}
              textColor="white"
              className="w-40"
            >
              Withdraw
            </Tab>
          </TabList>
        </Tabs>
        {simpleType === SimpleType.DEPOSIT ? (
          <DepositCard tokens={tokens} />
        ) : (
          <WithdrawCard tokens={tokens} />
        )}
      </Box>
    </Flex>
  );
}
