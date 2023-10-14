import { Flex } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { TokenConfig } from "../type";
import CipherCard from "./CipherCard";
import SimpleBtn from "./SimpleBtn";
import TokenSelector from "./TokenSelector";

type Props = {
  tokens: TokenConfig[] | undefined;
  isLoadingTokens: boolean;
};

export default function WithdrawCard(props: Props) {
  const { tokens, isLoadingTokens } = props;
  const [selectedToken, setSelectedToken] = useState<TokenConfig | undefined>(
    tokens ? tokens[0] : undefined
  );
  useEffect(() => {
    console.log({
      tokens,
    });
    if (!tokens) return;
    setSelectedToken(tokens[0]);
  }, [tokens]);
  return (
    <Flex className="p-8 flex flex-col justify-between items-center gap-8 h-[20rem] w-[25rem] rounded-3xl shadow-md bg-slate-300 m-8">
      <TokenSelector
        tokens={tokens}
        selectedToken={selectedToken}
        isLoadingTokens={isLoadingTokens}
        setSelectedToken={setSelectedToken}
      />
      <Flex className="w-[20rem]">
        <CipherCard placeholder="Enter your cipher here" />
      </Flex>
      <SimpleBtn colorScheme={"teal"} className="w-56">
        Withdraw
      </SimpleBtn>
    </Flex>
  );
}
