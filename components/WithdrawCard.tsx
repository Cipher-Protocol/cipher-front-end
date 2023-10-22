import { Flex, useDisclosure, useToast } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { TokenConfig } from "../type";
import CipherCard from "./CipherCard";
import SimpleBtn from "./SimpleBtn";
import TokenSelector from "./TokenSelector";
import { decodeCipherCode } from "../lib/cipher/CipherHelper";
import { useAccount } from "wagmi";
import WithdrawModal from "./WithdrawModal";
import { useDebounce } from "usehooks-ts";

type Props = {
  tokens: TokenConfig[];
  isLoadingTokens?: boolean;
};

export default function WithdrawCard(props: Props) {
  const { tokens, isLoadingTokens } = props;
  const toast = useToast();
  const { address } = useAccount();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(tokens[0]);
  const [cipherCode, setCipherCode] = useState<string>("");
  const [isValidCode, setIsValidCode] = useState<boolean>(false);
  const debouncedCipherCode = useDebounce(cipherCode, 1000);
  const [pubOutAmt, setPubOutAmt] = useState<bigint>();
  const [salt, setSalt] = useState<bigint>();
  const [random, setRandom] = useState<bigint>();

  useEffect(() => {
    if (!tokens) return;
    setSelectedToken(tokens[0]);
  }, [tokens]);

  useEffect(() => {
    if (!debouncedCipherCode) return;

    // 0x + 4 * 32 bytes
    if (cipherCode.length !== 258) {
      setIsValidCode(false);
      return;
    }
    const { tokenAddress, amount, salt, random, isCode } =
      decodeCipherCode(debouncedCipherCode);
    if (!isCode) {
      setIsValidCode(false);
      return;
    } else if (tokenAddress !== selectedToken?.address) {
      setIsValidCode(false);
      return;
    } else {
      setIsValidCode(true);
      setPubOutAmt(amount);
      setSalt(salt);
      setRandom(random);
    }
  }, [debouncedCipherCode, selectedToken]);

  const onValueChange = (value: string) => {
    setIsValidCode(false);
    setCipherCode(value);
  };

  const handleOpenWithdrawModal = () => {
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
      <Flex className="p-8 flex flex-col justify-between items-center gap-8 h-[20rem] w-[25rem] rounded-3xl shadow-md bg-slate-300 m-8">
        <TokenSelector
          tokens={tokens}
          selectedToken={selectedToken}
          isLoadingTokens={isLoadingTokens}
          setSelectedToken={setSelectedToken}
        />
        <Flex className="w-[20rem]">
          <CipherCard
            placeholder="Enter your cipher here"
            onValueChange={onValueChange}
          />
        </Flex>
        <SimpleBtn
          disabled={!isValidCode}
          colorScheme={"teal"}
          className="w-56"
          onClick={handleOpenWithdrawModal}
          // onClick={() => withdraw()}
        >
          Withdraw
        </SimpleBtn>
      </Flex>
      <WithdrawModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        token={selectedToken}
        pubOutAmt={pubOutAmt || 0n}
        salt={salt || 0n}
        random={random || 0n}
      />
    </>
  );
}
