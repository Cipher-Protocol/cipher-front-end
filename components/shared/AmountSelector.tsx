import { Button, Flex, NumberInput, NumberInputField } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [isCustomizedAmt, setIsCustomizedAmt] = useState<boolean>(false);

  useEffect(() => {
    if (amount !== undefined) return;
    // setSelectedAmt(undefined);
  }, [amount]);

  const handleAmount = useCallback((amt: number) => {
    setAmount(parseUnits(amt.toString(), selectedToken.decimals));
  }, [selectedToken.decimals, setAmount]);

  const selectedAmtBtn = useCallback((amt: number) => {
    console.log({
      message: '??',
      amt: amt,
    })
    handleAmount(amt);
    setSelectedAmt(amt);
  }, [handleAmount])

  const AmtBtnComponents = useMemo(() => {
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
              textColor: "brand",
            }}
            _active={{
              transform: "scale(0.9)",
            }}
            transitionDuration={"0.2s"}
            bgColor={selectedAmt === amt ? "white" : "whiteAlpha.400"}
            textColor={selectedAmt === amt ? "brand" : "white"}
            onClick={() => selectedAmtBtn(amt)}
          >
            {amt}
          </Button>
        ))}
      </Flex>
    );
  }, [selectedAmt, selectedAmtBtn]);

  return (
    <Flex className="flex flex-col w-full">
      <Flex className="gap-2 my-1 w-full justify-between">
        {isCustomizedAmt ? (
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
          AmtBtnComponents
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
        onClick={() => setIsCustomizedAmt(!isCustomizedAmt)}
      >
        {isCustomizedAmt ? "Select amount" : "Customized Amount"}
      </Button>
    </Flex>
  );
}
