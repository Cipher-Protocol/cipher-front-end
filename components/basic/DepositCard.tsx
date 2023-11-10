import React, { useEffect, useState } from "react";
import { Button, Flex, useDisclosure, useToast } from "@chakra-ui/react";
import { TokenConfig } from "../../type";
import TokenSelector from "../shared/TokenSelector";
import dynamic from "next/dynamic";
import DepositModal from "./DepositModal";
import { useAccount, useBalance } from "wagmi";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../../configs/tokenConfig";
import { useErc20 } from "../../hooks/useErc20";
import { CipherCoinInfo } from "../../lib/cipher/CipherCoin";
import {
  EncodeCipherCodeInterface,
  encodeCipherCode,
  toHashedSalt,
} from "../../lib/cipher/CipherHelper";
import { getRandomSnarkField } from "../../utils/getRandom";

const AmountSelector = dynamic(() => import("../shared/InputAmountSelector"), {
  ssr: false,
});

type Props = {
  tokens: TokenConfig[];
  isLoadingTokens?: boolean;
};

export default function DepositCard(props: Props) {
  const { tokens } = props;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { address } = useAccount();
  const [pubInAmt, setPubInAmt] = useState<bigint>();
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(tokens[0]);
  const { data: ethBalance } = useBalance({
    address: address,
  });
  const [balance, setBalance] = useState<bigint | undefined>(
    ethBalance?.value || 0n
  );
  const { balance: Erc20Balance } = useErc20(selectedToken?.address);
  const [cipherCode, setCipherCode] = useState<string>("");
  const [cipherCoinInfo, setCipherCoinInfo] = useState<CipherCoinInfo>({
    key: {
      hashedSaltOrUserId: 0n,
      inSaltOrSeed: 0n,
      inRandom: 0n,
    },
    amount: 0n,
  });

  useEffect(() => {
    if (pubInAmt === undefined) return;
    if (selectedToken === undefined) return;
    const salt = getRandomSnarkField();
    const random = getRandomSnarkField();
    const data: EncodeCipherCodeInterface = {
      tokenAddress: selectedToken.address,
      amount: pubInAmt,
      salt,
      random,
    };
    const encodedData = encodeCipherCode(data);
    setCipherCode(encodedData);
    const coin: CipherCoinInfo = {
      key: {
        hashedSaltOrUserId: toHashedSalt(salt.toBigInt()),
        inSaltOrSeed: salt.toBigInt(),
        inRandom: random.toBigInt(),
      },
      amount: pubInAmt,
    };

    setCipherCoinInfo(coin);
  }, [pubInAmt, selectedToken]);

  useEffect(() => {
    if (!tokens) return;
    setSelectedToken(tokens[0]);
  }, [tokens]);

  useEffect(() => {
    if (!address) return;
    if (selectedToken?.address === DEFAULT_NATIVE_TOKEN_ADDRESS) {
      setBalance(ethBalance?.value || 0n);
    } else {
      if (selectedToken === undefined || Erc20Balance === undefined) {
        setBalance(undefined);
      } else {
        setBalance(Erc20Balance);
      }
    }
  }, [ethBalance, Erc20Balance, address, selectedToken]);

  const handleOpenDepositModal = () => {
    if (address === undefined) {
      toast({
        title: "Please connect wallet",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    if (balance === undefined) return;
    if (pubInAmt === undefined || pubInAmt > balance) {
      toast({
        title: "Invalid amount",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } else if (selectedToken === undefined) {
      toast({
        title: "Please select token",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } else {
      onOpen();
    }
  };

  const customizedClose = () => {
    setPubInAmt(undefined);
    onClose();
  };

  return (
    <>
      <Flex className="flex flex-col justify-between items-center gap-8 h-full pt-10 pb-12">
        <TokenSelector
          tokens={tokens}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
        />
        <AmountSelector
          selectedToken={selectedToken}
          onAmountChange={setPubInAmt}
          balance={balance}
        />
        <Button
          className="w-full bg-white py-6"
          borderRadius={"full"}
          bgColor="white"
          _hover={{
            transform: "scale(1.05)",
            textColor: "brand",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
          transitionDuration={"0.2s"}
          onClick={handleOpenDepositModal}
        >
          Deposit
        </Button>
      </Flex>
      <DepositModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={customizedClose}
        pubInAmt={pubInAmt || 0n}
        token={selectedToken}
        cipherCode={cipherCode}
        cipherCoinInfo={cipherCoinInfo}
        setCipherCoinInfo={setCipherCoinInfo}
      />
    </>
  );
}
