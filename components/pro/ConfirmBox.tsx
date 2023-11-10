import {
  Button,
  Divider,
  Flex,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { TokenConfig } from "../../type";
import ConfirmModal from "./ConfirmModal";
import {
  CipherCoinInfo,
  CipherTransferableCoin,
} from "../../lib/cipher/CipherCoin";
import { useAccount } from "wagmi";

type Props = {
  publicInAmt: bigint;
  totalPrivateInAmt: bigint;
  publicOutAmt: bigint;
  totalPrivateOutAmt: bigint;
  selectedToken: TokenConfig;
  privateInCoins: Array<CipherTransferableCoin | null>;
  privateOutCoins: Array<CipherCoinInfo | null>;
};

export default function ConfirmBox(props: Props) {
  const {
    publicInAmt,
    totalPrivateInAmt,
    publicOutAmt,
    totalPrivateOutAmt,
    selectedToken,
    privateInCoins,
    privateOutCoins,
  } = props;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { address } = useAccount();
  const [amountIsEqual, setAmountIsEqual] = useState<boolean>(false);
  const [amountIsValid, setAmountIsValid] = useState<boolean>(false);

  useEffect(() => {
    if (amountIsEqual && publicInAmt + totalPrivateInAmt !== 0n) {
      setAmountIsValid(true);
    } else {
      setAmountIsValid(false);
    }
  }, [amountIsEqual, publicInAmt, totalPrivateInAmt]);

  useEffect(() => {
    if (publicInAmt + totalPrivateInAmt === publicOutAmt + totalPrivateOutAmt) {
      setAmountIsEqual(true);
    } else {
      setAmountIsEqual(false);
    }
  }, [publicInAmt, totalPrivateInAmt, publicOutAmt, totalPrivateOutAmt]);

  const handleOpenModal = () => {
    if (address === undefined) {
      toast({
        title: "Please connect wallet",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } else if (!amountIsValid) {
      toast({
        title: "Invalid amount",
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
    <Flex
      className="w-full py-6 flex flex-row justify-between items-center gap-8 rounded-3xl shadow-md grid-cols-3 px-12 my-6"
      bgColor={"whiteAlpha.400"}
      backdropFilter="blur(10px)"
    >
      <Button
        className="w-full py-6"
        borderRadius="full"
        textColor={"white"}
        bgColor="whiteAlpha.400"
        _hover={{
          cursor: "not-allowed",
        }}
        _active={{
          bgColor: "whiteAlpha.400",
        }}
        transitionDuration={"0.2s"}
      >
        select relayer
      </Button>
      <Flex className="w-full h-full flex flex-col justify-center items-center">
        <Flex className="w-full h-1/2 flex flex-row justify-center items-center text-white">
          <Text color="whiteAlpha.700" className="w-2/5 text-right">
            Input:{" "}
            {formatUnits(
              publicInAmt + totalPrivateInAmt,
              selectedToken.decimals
            )}
          </Text>
          <Divider
            orientation="vertical"
            className="mx-4 h-full"
            borderColor="whiteAlpha.700"
          />
          <Text color="whiteAlpha.700" className="w-2/5 text-left">
            Output:{" "}
            {formatUnits(
              publicOutAmt + totalPrivateOutAmt,
              selectedToken.decimals
            )}
          </Text>
        </Flex>
        {amountIsEqual ? undefined : (
          <Text
            className="w-full text-center"
            textColor="rgba(255, 157, 169, 1)"
          >
            Amount not equal
          </Text>
        )}
      </Flex>
      <Button
        className="w-full py-6"
        borderRadius="full"
        textColor={amountIsValid ? "black" : "whiteAlpha.400"}
        bgColor={amountIsValid ? "white" : "whiteAlpha.400"}
        _hover={
          amountIsValid
            ? {
                transform: "scale(1.05)",
                bgColor: "white",
                textColor: "brand",
              }
            : {
                cursor: "not-allowed",
              }
        }
        _active={
          amountIsValid
            ? {
                transform: "scale(0.95)",
              }
            : {
                cursor: "not-allowed",
              }
        }
        transitionDuration={"0.2s"}
        onClick={amountIsValid ? handleOpenModal : undefined}
      >
        Send transaction
      </Button>
      <ConfirmModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        selectedToken={selectedToken}
        publicInAmt={publicInAmt}
        publicOutAmt={publicOutAmt}
        privateInCoins={privateInCoins}
        privateOutCoins={privateOutCoins}
      />
    </Flex>
  );
}
