import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import PublicInput from "../PublicInput";
import { useAccount, useBalance } from "wagmi";
import { useState } from "react";
import { useErc20 } from "../../hooks/useErc20";
import { TokenConfig } from "../../type";

type Props = {
  balance: bigint | undefined;
  selectedToken: TokenConfig;
  pubInAmt: bigint | undefined;
  setPubInAmt: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export default function PublicInputModal(props: Props) {
  const {
    balance,
    selectedToken,
    pubInAmt,
    setPubInAmt,
    isOpen,
    onOpen,
    onClose,
  } = props;
  const toast = useToast();

  const handleSavePubInAmt = () => {
    if (pubInAmt === undefined || pubInAmt > balance!) {
      toast({
        title: "Invalid amount",
        description: `Please enter a valid amount`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} size={"md"} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        bgColor={"whiteAlpha.400"}
        borderRadius={"3xl"}
        className="px-8 py-4"
        color={"white"}
        backdropFilter={"blur(10px)"}
      >
        <ModalHeader fontSize={"3xl"}>Public input</ModalHeader>
        <ModalCloseButton
          className="m-6"
          size={"lg"}
          _hover={{
            color: "#6B39AB",
            bgColor: "white",
          }}
          _active={{
            color: "#6B39AB",
            bgColor: "white",
          }}
        />
        <ModalBody>
          <Flex className="flex flex-col justify-between gap-4 h-[20rem]">
            <Text>Deposit {selectedToken.symbol} from your wallet</Text>
            <PublicInput
              pubInAmt={pubInAmt}
              setPubInAmt={setPubInAmt}
              selectedToken={selectedToken}
              balance={balance}
            />
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
              onClick={handleSavePubInAmt}
            >
              Save
            </Button>
          </Flex>
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
