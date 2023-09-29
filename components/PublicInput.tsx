import { DEFAULT_ETH_ADDRESS } from "@/configs/tokenConfig";
import { useErc20 } from "@/hooks/useErc20";
import { TokenConfig } from "@/type";
import {
  Flex,
  Text,
  NumberInput,
  NumberInputField,
  Button,
} from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import React, { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";

type Props = {
  pubInAmt: BigNumber | undefined;
  setPubInAmt: React.Dispatch<React.SetStateAction<BigNumber | undefined>>;
  selectedToken: TokenConfig | undefined;
};

const amountTable = [0.01, 0.1, 1, 10];

export default function PublicInput(props: Props) {
  const { pubInAmt, setPubInAmt, selectedToken } = props;
  const { address } = useAccount();
  const { data: ethBalance } = useBalance({
    address: address,
  });
  const { balance: Erc20Balance, decimals: Erc20Decimals } = useErc20(
    selectedToken?.address
  );
  const [balance, setBalance] = useState<BigInt | undefined>(ethBalance?.value);
  const [decimals, setDecimals] = useState<number | undefined>(18);

  useEffect(() => {
    if (selectedToken?.address === DEFAULT_ETH_ADDRESS) {
      setBalance(ethBalance?.value);
      setDecimals(18);
    } else {
      setBalance(Erc20Balance);
      setDecimals(Erc20Decimals);
    }
  }, [selectedToken, ethBalance, Erc20Balance, Erc20Decimals]);

  const handlePubInAmt = (amt: number) => {
    setPubInAmt(utils.parseEther(amt.toString()));
  };

  return (
    <Flex className="flex flex-col items-end">
      <Text fontSize="sm">
        Balance: &nbsp;
        {balance
          ? Number(
              utils.formatUnits(BigNumber.from(balance), decimals)
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
            ? Number(utils.formatUnits(BigNumber.from(balance), decimals))
            : 0
        }
        onChange={(value) => handlePubInAmt(Number(value))}
        value={pubInAmt ? Number(utils.formatEther(pubInAmt)) : 0}
      >
        <NumberInputField placeholder="Deposit Amount" borderRadius={"full"} />
      </NumberInput>
    </Flex>
  );
}
