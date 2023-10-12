import React, { useEffect, useState } from "react";
import { Flex, useDisclosure, useToast } from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import { TokenConfig } from "../type";
import TokenSelector from "./TokenSelector";
import SimpleBtn from "./SimpleBtn";
import dynamic from "next/dynamic";
import DepositModal from "./DepositModal";
import { useAccount, useBalance } from "wagmi";
import { DEFAULT_ETH_ADDRESS } from "../configs/tokenConfig";
import { useErc20 } from "../hooks/useErc20";
import { getSnarkFieldRandom } from "../utils/getRandom";
const poseidon = require("poseidon-encryption");

const PublicInput = dynamic(() => import("./PublicInput"), {
  ssr: false,
});

type Props = {
  tokens: TokenConfig[] | undefined;
  isLoadingTokens: boolean;
};

export default function DepositCard(props: Props) {
  const { tokens, isLoadingTokens } = props;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { address } = useAccount();
  const [pubInAmt, setPubInAmt] = useState<BigNumber>();
  const [selectedToken, setSelectedToken] = useState<TokenConfig | undefined>(
    tokens ? tokens[0] : undefined
  );
  const { data: ethBalance } = useBalance({
    address: address,
  });
  const [balance, setBalance] = useState<BigNumber | undefined>(
    BigNumber.from(ethBalance?.value || 0)
  );
  const { balance: Erc20Balance, decimals: Erc20Decimals } = useErc20(
    selectedToken?.address
  );
  const [cipherHex, setCipherHex] = useState<string>("");
  const [hashedSalt, setHashedSalt] = useState<string>("");

  useEffect(() => {
    if (pubInAmt === undefined) return;
    const random = getSnarkFieldRandom();
    const salt = getSnarkFieldRandom();
    const hashedSalt = poseidon.poseidon([salt.toString()]);
    setHashedSalt(hashedSalt);
    const abiCoder = utils.defaultAbiCoder;
    const encodedData = abiCoder.encode(
      ["uint256", "uint256", "uint256"],
      [pubInAmt, salt, random]
    );
    setCipherHex(encodedData);
  }, [pubInAmt]);

  useEffect(() => {
    if (!tokens) return;
    setSelectedToken(tokens[0]);
  }, [tokens]);

  useEffect(() => {
    if (!address) return;
    if (selectedToken?.address === DEFAULT_ETH_ADDRESS) {
      setBalance(BigNumber.from(ethBalance?.value || 0));
      setSelectedToken({
        ...selectedToken,
        decimals: 18,
      });
    } else {
      if (selectedToken === undefined) return;
      if (Erc20Balance === undefined || Erc20Decimals === undefined) return;
      setBalance(Erc20Balance);
      setSelectedToken({
        ...selectedToken,
        decimals: Erc20Decimals,
      });
    }
  }, [selectedToken, ethBalance, Erc20Balance, Erc20Decimals, address]);

  const handleOpenDepositModal = () => {
    console.log({
      address,
      balance,
      pubInAmt,
      selectedToken,
    });
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
    if (pubInAmt === undefined || pubInAmt.gt(balance)) {
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
      <Flex className="p-8 flex flex-col justify-between items-center gap-8 h-[20rem] w-[25rem] rounded-3xl shadow-md bg-slate-300 m-8">
        <TokenSelector
          tokens={tokens}
          selectedToken={selectedToken}
          isLoadingTokens={isLoadingTokens}
          setSelectedToken={setSelectedToken}
        />
        <PublicInput
          pubInAmt={pubInAmt}
          selectedToken={selectedToken}
          setPubInAmt={setPubInAmt}
          balance={balance}
        />
        <SimpleBtn
          colorScheme={"teal"}
          className="w-56"
          onClick={handleOpenDepositModal}
        >
          Deposit
        </SimpleBtn>
      </Flex>
      <DepositModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        pubInAmt={pubInAmt}
        token={selectedToken}
        cipherHex={cipherHex}
        hashedSalt={hashedSalt}
      />
    </>
  );
}
