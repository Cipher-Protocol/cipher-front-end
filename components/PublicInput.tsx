import { TokenConfig } from "../type";
import {
  Flex,
  Text,
  NumberInput,
  NumberInputField,
  Button,
} from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import React, { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import SimpleBtn from "./SimpleBtn";

type Props = {
  pubInAmt: bigint | undefined;
  setPubInAmt: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  selectedToken: TokenConfig;
  balance: bigint | undefined;
};

const amountTable = [0.01, 0.1, 1, 10];

export default function PublicInput(props: Props) {
  const { pubInAmt, setPubInAmt, balance, selectedToken } = props;
  const [isCustomAmt, setIsCustomAmt] = useState<boolean>(false);
  const [selectedAmt, setSelectedAmt] = useState<number>();

  const handlePubInAmt = (amt: number) => {
    setPubInAmt(parseUnits(amt.toString(), selectedToken.decimals));
  };

  const renderAmtBtns = () => {
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
              handlePubInAmt(amt);
              setSelectedAmt(amt);
            }}
          >
            {amt}
          </Button>
        ))}
      </Flex>
    );
  };

  return (
    <Flex className="flex flex-col items-end w-full">
      <Text fontSize="md" textColor="whiteAlpha.700">
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
            value={
              pubInAmt
                ? Number(formatUnits(pubInAmt, selectedToken?.decimals))
                : 0
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
          transform: "scale(1.05)",
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
