import React, { useEffect, useState } from "react";
import { Flex } from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { TokenConfig } from "@/type";
import TokenSelector from "./TokenSelector";
import SimpleBtn from "./SimpleBtn";
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
      <SimpleBtn colorScheme={"teal"} className="w-56">
        Deposit
      </SimpleBtn>
    </Flex>
  );
}
