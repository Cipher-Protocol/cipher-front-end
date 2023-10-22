import { Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import TokenSelector from "../TokenSelector";
import SimpleBtn from "../SimpleBtn";
import { TokenConfig } from "../../type";

type Props = {
  tokens: TokenConfig[];
  selectedToken: TokenConfig;
  setSelectedToken: React.Dispatch<React.SetStateAction<TokenConfig>>;
};

export default function SelectBox(props: Props) {
  const { tokens, selectedToken, setSelectedToken } = props;

  return (
    <Flex className="w-full p-8 flex flex-col justify-between items-center gap-8 h-[20rem] rounded-3xl shadow-md bg-slate-300">
      <TokenSelector
        tokens={tokens}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
      />
      <SimpleBtn disabled={true} colorScheme="teal" className="w-56">
        Select relayer
      </SimpleBtn>
      <SimpleBtn colorScheme={"teal"} className="w-56">
        Send transaction
      </SimpleBtn>
    </Flex>
  );
}
