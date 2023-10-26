import React, { useEffect, useState } from "react";
import { Flex, useDisclosure, useToast } from "@chakra-ui/react";
import { TokenConfig } from "../type";
import TokenSelector from "./TokenSelector";
import SimpleBtn from "./SimpleBtn";
import dynamic from "next/dynamic";
import DepositModal from "./DepositModal";
import { useAccount, useBalance } from "wagmi";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../configs/tokenConfig";
import { useErc20 } from "../hooks/useErc20";
import { CipherCoinInfo } from "../lib/cipher/CipherCoin";
import { encodeCipherCode, toHashedSalt } from "../lib/cipher/CipherHelper";
import { getRandomSnarkField } from "../utils/getRandom";

const PublicInput = dynamic(() => import("./PublicInput"), {
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
    const data = {
      tokenAddress: selectedToken.address,
      amount: pubInAmt,
      salt: getRandomSnarkField(),
      random: getRandomSnarkField(),
    };
    const encodedData = encodeCipherCode(data);
    setCipherCode(encodedData);
    const coin: CipherCoinInfo = {
      key: {
        hashedSaltOrUserId: toHashedSalt(data.salt.toBigInt()),
        inSaltOrSeed: data.salt.toBigInt(),
        inRandom: data.random.toBigInt(),
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

  return (
    <>
      <Flex className="flex flex-col justify-between items-center gap-8 h-full pt-10 pb-12">
        <TokenSelector
          tokens={tokens}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
        />
        <PublicInput
          pubInAmt={pubInAmt}
          selectedToken={selectedToken}
          setPubInAmt={setPubInAmt}
          balance={balance}
        />
        <SimpleBtn
          className="w-full bg-white py-6"
          onClick={handleOpenDepositModal}
        >
          Deposit
        </SimpleBtn>
      </Flex>
      <DepositModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        pubInAmt={pubInAmt || 0n}
        token={selectedToken}
        cipherCode={cipherCode}
        cipherCoinInfo={cipherCoinInfo}
        setCipherCoinInfo={setCipherCoinInfo}
      />
    </>
  );
}
