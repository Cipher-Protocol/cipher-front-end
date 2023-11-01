import { Button, Flex, useDisclosure, useToast } from "@chakra-ui/react";
import React from "react";
import { TokenConfig } from "../../type";
import TokenSelector from "../shared/TokenSelector";
import PublicInputModal from "./PublicInputModal";
import { formatUnits } from "viem";
import PublicOutputModal from "./PublicOutputModal";
import { useAccount } from "wagmi";

type Props = {
  balance: bigint | undefined;
  publicInAmt: bigint;
  setPublicInAmt: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  publicOutAmt: bigint;
  setPublicOutAmt: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  tokens: TokenConfig[] | undefined;
  selectedToken: TokenConfig;
  isLoadingTokens?: boolean;
  setSelectedToken: React.Dispatch<React.SetStateAction<TokenConfig>>;
  onDownload?: () => void;
  onPrepare?: () => void;
  onSendTransaction?: () => void;
};
export default function SelectBox(props: Props) {
  const {
    balance,
    publicInAmt,
    setPublicInAmt,
    publicOutAmt,
    setPublicOutAmt,
    tokens,
    selectedToken,
    isLoadingTokens,
    setSelectedToken,
    onPrepare,
  } = props;
  const {
    isOpen: isOpenPublicInModal,
    onOpen: onOpenPublicInModal,
    onClose: onClosePublicInModal,
  } = useDisclosure();
  const {
    isOpen: isOpenPublicOutModal,
    onOpen: onOpenPublicOutModal,
    onClose: onClosePublicOutModal,
  } = useDisclosure();
  const toast = useToast();
  const { address } = useAccount();

  const resetPublicInput = () => {
    setPublicInAmt(0n);
    onOpenPublicInModal();
  };

  const resetPublicOutput = () => {
    setPublicOutAmt(0n);
    onOpenPublicOutModal();
  };

  const handleOpenPublicInModal = () => {
    if (address === undefined) {
      toast({
        title: "Please connect wallet",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } else {
      onOpenPublicInModal();
    }
  };

  const handleOpenPublicOutModal = () => {
    if (address === undefined) {
      toast({
        title: "Please connect wallet",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } else {
      onOpenPublicOutModal();
    }
  };

  return (
    <Flex
      className="w-full py-6 flex flex-row justify-between items-center gap-8 rounded-3xl shadow-md grid-cols-3 px-12"
      bgColor={"whiteAlpha.400"}
      backdropFilter="blur(10px)"
    >
      {/* <SimpleBtn disabled={true} colorScheme="teal" className="w-56">
        Select relayer
      </SimpleBtn> */}
      {/* <SimpleBtn disabled={true} colorScheme="teal" className="w-56">
      Set Recipient
    </SimpleBtn> */}
      {publicInAmt ? (
        <Button
          className="w-full py-6"
          borderRadius="full"
          textColor={"white"}
          bgColor="whiteAlpha.400"
          _hover={{
            bgColor: "whiteAlpha.500",
          }}
          _active={{}}
          onClick={resetPublicInput}
        >
          Deposit: {formatUnits(publicInAmt, selectedToken.decimals)}{" "}
          {selectedToken.symbol}
        </Button>
      ) : (
        <Button
          className="w-full py-6"
          borderRadius="full"
          textColor={"white"}
          bgColor="whiteAlpha.400"
          _hover={{
            transform: "scale(1.05)",
            bgColor: "white",
            textColor: "#6B39AB",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
          transitionDuration={"0.2s"}
          onClick={handleOpenPublicInModal}
        >
          Deposit from wallet
        </Button>
      )}
      <TokenSelector
        tokens={tokens}
        selectedToken={selectedToken}
        isLoadingTokens={isLoadingTokens}
        setSelectedToken={setSelectedToken}
      />
      {publicOutAmt ? (
        <Button
          className="w-full py-6"
          borderRadius="full"
          textColor={"white"}
          bgColor="whiteAlpha.400"
          _hover={{
            bgColor: "whiteAlpha.500",
          }}
          _active={{}}
          onClick={resetPublicOutput}
        >
          Withdraw: {formatUnits(publicOutAmt, selectedToken.decimals)}{" "}
          {selectedToken.symbol}
        </Button>
      ) : (
        <Button
          className="w-full py-6"
          borderRadius="full"
          textColor={"white"}
          bgColor="whiteAlpha.400"
          _hover={{
            transform: "scale(1.05)",
            bgColor: "white",
            textColor: "#6B39AB",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
          transitionDuration={"0.2s"}
          onClick={handleOpenPublicOutModal}
        >
          Withdraw to wallet
        </Button>
      )}
      {/* <Button
        className="w-full py-6"
        borderRadius="full"
        textColor={"white"}
        bgColor="whiteAlpha.400"
        _hover={{
          transform: "scale(1.05)",
          bgColor: "white",
          textColor: "#6B39AB",
        }}
        _active={{
          transform: "scale(0.95)",
        }}
        transitionDuration={"0.2s"}
        onClick={() => {
          onPrepare && onPrepare();
        }}
      >
        Prepare Proof
      </Button> */}

      {/* <SimpleBtn
        colorScheme={"teal"}
        className="w-56"
        onClick={() => {
          onSendTransaction && onSendTransaction();
        }}
      >
        Send transaction
      </SimpleBtn> */}
      <PublicInputModal
        balance={balance}
        selectedToken={selectedToken}
        publicInAmt={publicInAmt}
        setPublicInAmt={setPublicInAmt}
        resetPublicInput={resetPublicInput}
        isOpen={isOpenPublicInModal}
        onOpen={onOpenPublicInModal}
        onClose={onClosePublicInModal}
      />
      <PublicOutputModal
        balance={balance}
        selectedToken={selectedToken}
        publicOutAmt={publicOutAmt}
        setPublicOutAmt={setPublicOutAmt}
        resetPublicOutput={resetPublicOutput}
        isOpen={isOpenPublicOutModal}
        onOpen={onOpenPublicOutModal}
        onClose={onClosePublicOutModal}
      />
    </Flex>
  );
}
