import React, { useEffect, useState } from "react";
import SelectorBox from "./TokenSelector";
import { Flex } from "@chakra-ui/react";
// import PublicInput from "./PublicInput";
import { BigNumber } from "ethers";
import { TokenConfig } from "@/type";
import Btn from "./Btn";
import TokenSelector from "./TokenSelector";
import dynamic from "next/dynamic";

const PublicInput = dynamic(() => import("./PublicInput"), {
  ssr: false,
});

type Props = {
  tokens: TokenConfig[] | undefined;
  isLoadingTokens: boolean;
};

export default function DepositCard(props: Props) {
  const { tokens, isLoadingTokens } = props;
  const [pubInAmt, setPubInAmt] = useState<BigNumber>();
  const [selectedToken, setSelectedToken] = useState<TokenConfig | undefined>(
    tokens ? tokens[0] : undefined
  );

  useEffect(() => {
    if (tokens) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens]);

  return (
    <Flex className="p-8 flex flex-col justify-between items-center gap-8 h-[20rem] w-[25rem] rounded-3xl shadow-md bg-slate-300 m-8">
      <TokenSelector
        tokens={tokens}
        selectedToken={selectedToken}
        isLoadingTokens={isLoadingTokens}
        setSelectedToken={setSelectedToken}
      />
      <PublicInput
        pubInAmt={pubInAmt}
        selectedToken={selectedToken}
        setPubInAmt={setPubInAmt}
      />
      <Btn colorScheme={"teal"} className="w-56">
        Deposit
      </Btn>
    </Flex>
  );
}
