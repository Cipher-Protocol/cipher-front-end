import { TokenConfig } from "../../type";
import { Flex, Text } from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import React from "react";
import AmountSelector from "./AmountSelector";
import { formatUnits } from "viem";

type Props = {
  onAmountChange: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  selectedToken: TokenConfig;
  balance: bigint | undefined;
};

export default function InputAmountSelector(props: Props) {
  const { onAmountChange, balance, selectedToken } = props;

  return (
    <Flex className="flex flex-col items-end w-full">
      <Text fontSize="md" textColor="whiteAlpha.700">
        Balance: &nbsp;
        {balance
          ? Number(formatUnits(balance, selectedToken?.decimals)).toFixed(4)
          : 0}
      </Text>
      <AmountSelector
        onAmountChange={onAmountChange}
        selectedToken={selectedToken}
        maxAmt={
          balance ? Number(formatUnits(balance, selectedToken?.decimals)) : 0
        }
      />
    </Flex>
  );
}
