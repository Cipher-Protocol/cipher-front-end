import { Button, Divider, Flex, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { formatUnits } from "viem";
import { TokenConfig } from "../../type";
import ConfirmModal from "./ConfirmModal";
import {
  CipherCoinInfo,
  CipherTransferableCoin,
} from "../../lib/cipher/CipherCoin";

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
        {publicInAmt + totalPrivateInAmt ===
        publicOutAmt + totalPrivateOutAmt ? undefined : (
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
        onClick={onOpen}
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
