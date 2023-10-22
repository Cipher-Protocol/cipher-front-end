import { TokenConfig } from "../type";
import { Flex, NumberInput, NumberInputField, Button } from "@chakra-ui/react";
import React from "react";
import { formatUnits, parseUnits } from "viem";

type Props = {
  selectedToken: TokenConfig;
};

const amountTable = [0.01, 0.1, 1, 10];

export default function PrivateOutput(props: Props) {
  const { selectedToken } = props;

  // const handlePubInAmt = (amt: number) => {
  //   setPrivOutAmt(parseUnits(amt.toString(), selectedToken.decimals));
  // };

  return (
    <Flex className="flex flex-col items-end bg-slate-300 py-2 px-4 rounded-2xl">
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
            // onClick={() => handlePubInAmt(amt)}
          >
            {amt}
          </Button>
        ))}
      </Flex>
      <NumberInput
        variant="outline"
        min={0}
        // max={
        //   balance
        //     ? Number(
        //         utils.formatUnits(
        //           BigNumber.from(balance),
        //           selectedToken?.decimals
        //         )
        //       )
        //     : 0
        // }
        // onChange={(value) => handlePubInAmt(Number(value))}
        // value={
        //   privOutAmt
        //     ? Number(formatUnits(privOutAmt, selectedToken?.decimals))
        //     : 0
        // }
      >
        <NumberInputField placeholder="Deposit Amount" borderRadius={"full"} />
      </NumberInput>
    </Flex>
  );
}
