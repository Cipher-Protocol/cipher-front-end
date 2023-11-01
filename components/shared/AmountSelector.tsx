import { Button, Flex, NumberInput, NumberInputField } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { TokenConfig } from "../../type";

const amountTable = [0.01, 0.1, 1, 10];

type Props = {
  amount: bigint | undefined;
  setAmount: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  selectedToken: TokenConfig;
  maxAmt?: number;
};

export default function AmountSelector(props: Props) {
  const { amount, setAmount, selectedToken, maxAmt } = props;
  const [selectedAmt, setSelectedAmt] = useState<number>();
  const [isCustomAmt, setIsCustomAmt] = useState<boolean>(false);

  useEffect(() => {
    if (amount !== undefined) return;
    setSelectedAmt(undefined);
  }, [amount]);

  const handleAmount = (amt: number) => {
    setAmount(parseUnits(amt.toString(), selectedToken.decimals));
  };

  const renderAmtBtns = useCallback(() => {
    return (
      <Flex className="gap-2 my-1 w-full justify-between">
        {amountTable.map((amt) => (
          <Button
            key={amt}
            borderRadius="2xl"
            w={"22%"}
            fontSize={"sm"}
            _hover={{
              transform: "scale(1.1)",
              bgColor: "white",
              textColor: "#6B39AB",
            }}
            _active={{
              transform: "scale(0.9)",
            }}
            transitionDuration={"0.2s"}
            bgColor={selectedAmt === amt ? "white" : "whiteAlpha.400"}
            textColor={selectedAmt === amt ? "#6B39AB" : "white"}
            onClick={() => {
              handleAmount(amt);
              setSelectedAmt(amt);
            }}
          >
            {amt}
          </Button>
        ))}
      </Flex>
    );
  }, [selectedAmt]);

  return (
    <Flex className="flex flex-col w-full">
      <Flex className="gap-2 my-1 w-full justify-between">
        {isCustomAmt ? (
          <NumberInput
            variant="outline"
            borderRadius={"full"}
            w={"100%"}
            my={1}
            textColor={"white"}
            _focus={{ borderColor: "white" }}
            focusBorderColor="transparent"
            min={0}
            max={maxAmt ? maxAmt : undefined}
            onChange={(value) => handleAmount(Number(value))}
            value={
              amount ? Number(formatUnits(amount, selectedToken?.decimals)) : 0
            }
          >
            <NumberInputField
              placeholder="Deposit Amount"
              borderRadius={"full"}
              bgColor={"whiteAlpha.400"}
              _focus={{ borderColor: "white" }}
              px={6}
              fontSize={"lg"}
            />
          </NumberInput>
        ) : (
          renderAmtBtns()
        )}
      </Flex>
      <Button
        className="w-full my-2"
        borderRadius={"full"}
        bgColor={"whiteAlpha.400"}
        textColor={"white"}
        _hover={{
          bgColor: "whiteAlpha.500",
        }}
        _active={{
          transform: "scale(0.95)",
        }}
        transitionDuration={"0.2s"}
        onClick={() => setIsCustomAmt(!isCustomAmt)}
      >
        {isCustomAmt ? "Select amount" : "Custom Amount"}
      </Button>
    </Flex>
  );
}
