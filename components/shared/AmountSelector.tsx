import { Button, Flex, NumberInput, NumberInputField } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { TokenConfig } from "../../type";

const amountTable = [0.01, 0.1, 1, 10];

type Props = {
  // amount: bigint | undefined;
  onAmountChange: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  selectedToken: TokenConfig;
  maxAmt?: number;
};

export default function AmountSelector(props: Props) {
  const { onAmountChange, selectedToken, maxAmt } = props;
  const [amount, setAmount] = useState<bigint | undefined>(undefined);

  const [numberInputValue, setNumberInputValue] = useState<
    string | undefined
  >();
  // const [selectedAmt, setSelectedAmt] = useState<number | undefined>(undefined);
  const [isCustomizedAmt, setIsCustomizedAmt] = useState<boolean>(false);

  const _setAmount = (amt: bigint) => {
    onAmountChange(amt);
    setAmount(amt);
  };

  const handleNumberInputChange = useCallback(
    (val: string) => {
      const decimalRegex = new RegExp(
        `^-?\\d+(\\.\\d{0,${selectedToken.decimals}})?$`
      );
      if (decimalRegex.test(val)) {
        const rawAmount = parseUnits(val, selectedToken.decimals);
        console.log(rawAmount);
        _setAmount(rawAmount);
        setNumberInputValue(val);
      } else {
        _setAmount(0n);
        setNumberInputValue("");
      }
    },
    [onAmountChange, selectedToken.decimals]
  );

  const handleSelectedAmtBtnClicked = useCallback(
    (amt: number) => {
      const rawAmount = parseUnits(amt.toString(), selectedToken.decimals);
      _setAmount(rawAmount);
      setNumberInputValue(amt?.toString());
    },
    [selectedToken.decimals]
  );

  const isSelectedBtnActive = useCallback(
    (selectedAmt: number) => {
      const rawAmount = parseUnits(
        selectedAmt.toString(),
        selectedToken.decimals
      );
      return rawAmount === BigInt(amount || 0);
    },
    [amount, selectedToken.decimals]
  );

  const AmtBtnComponents = useMemo(() => {
    return (
      <Flex className="gap-2 my-1 w-full justify-between">
        {amountTable.map((selectedAmt) => (
          <Button
            key={selectedAmt}
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
            bgColor={
              isSelectedBtnActive(selectedAmt) ? "white" : "whiteAlpha.400"
            }
            textColor={isSelectedBtnActive(selectedAmt) ? "brand" : "white"}
            onClick={() => handleSelectedAmtBtnClicked(selectedAmt)}
          >
            {selectedAmt}
          </Button>
        ))}
      </Flex>
    );
  }, [handleSelectedAmtBtnClicked, isSelectedBtnActive]);

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
            onChange={(value) => handleNumberInputChange(value)}
            value={numberInputValue}
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
