import { TokenConfig } from "../type";
import {
  Flex,
  Text,
  NumberInput,
  NumberInputField,
  Button,
} from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import React from "react";

type Props = {
  pubInAmt: BigNumber | undefined;
  setPubInAmt: React.Dispatch<React.SetStateAction<BigNumber | undefined>>;
  selectedToken: TokenConfig | undefined;
  balance: BigNumber | undefined;
};

const amountTable = [0.01, 0.1, 1, 10];

export default function PublicInput(props: Props) {
  const { pubInAmt, setPubInAmt, balance, selectedToken } = props;

  const handlePubInAmt = (amt: number) => {
    setPubInAmt(utils.parseUnits(amt.toString(), selectedToken?.decimals));
  };

  return (
    <Flex className="flex flex-col items-end">
      <Text fontSize="sm">
        Balance: &nbsp;
        {balance
          ? Number(
              utils.formatUnits(
                BigNumber.from(balance),
                selectedToken?.decimals
              )
            ).toFixed(4)
          : 0}
      </Text>
      <Flex className="gap-2 my-1">
        {amountTable.map((amt) => (
          <Button
            key={amt}
            colorScheme="blue"
            borderRadius="md"
            fontSize={"xs"}
            h={"1.2rem"}
            w={"1rem"}
            _hover={{
              transform: "scale(1.1)",
            }}
            _active={{
              transform: "scale(0.9)",
            }}
            transitionDuration={"0.2s"}
            onClick={() => handlePubInAmt(amt)}
          >
            {amt}
          </Button>
        ))}
      </Flex>
      <NumberInput
        variant="outline"
        min={0}
        max={
          balance
            ? Number(
                utils.formatUnits(
                  BigNumber.from(balance),
                  selectedToken?.decimals
                )
              )
            : 0
        }
        onChange={(value) => handlePubInAmt(Number(value))}
        value={pubInAmt ? Number(utils.formatUnits(pubInAmt, selectedToken?.decimals)) : 0}
      >
        <NumberInputField placeholder="Deposit Amount" borderRadius={"full"} />
      </NumberInput>
    </Flex>
  );
}
