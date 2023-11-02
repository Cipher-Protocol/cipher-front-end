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
import AmountSelector from "../shared/AmountSelector";
import { TokenConfig } from "../../type";

type Props = {
  balance: bigint | undefined;
  selectedToken: TokenConfig;
  publicOutAmt: bigint | undefined;
  setPublicOutAmt: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  resetPublicOutput: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export default function PublicOutputModal(props: Props) {
  const {
    balance,
    selectedToken,
    publicOutAmt,
    setPublicOutAmt,
    resetPublicOutput,
    isOpen,
    onOpen,
    onClose,
  } = props;
  const toast = useToast();

  const handleSavePubOutAmt = () => {
    if (publicOutAmt === undefined) {
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

  const resetClose = () => {
    resetPublicOutput();
    onClose();
  };

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      size={"md"}
      onClose={resetClose}
    >
      <ModalOverlay />
      <ModalContent
        bgColor={"whiteAlpha.400"}
        borderRadius={"3xl"}
        className="px-8 py-4"
        color={"white"}
        backdropFilter={"blur(10px)"}
      >
        <ModalHeader fontSize={"3xl"}>Withdraw</ModalHeader>
        <ModalCloseButton
          className="m-6"
          size={"lg"}
          _hover={{
            color: "brand",
            bgColor: "white",
          }}
          _active={{
            color: "brand",
            bgColor: "white",
          }}
        />
        <ModalBody>
          <Flex className="flex flex-col justify-between gap-4 h-[20rem]">
            <Text>Withdraw {selectedToken.symbol} to your wallet</Text>
            <AmountSelector
              amount={publicOutAmt}
              setAmount={setPublicOutAmt}
              selectedToken={selectedToken}
            />
            <Button
              className="w-full py-6"
              borderRadius="full"
              textColor={"white"}
              bgColor="whiteAlpha.400"
              _hover={{
                transform: "scale(1.05)",
                bgColor: "white",
                textColor: "brand",
              }}
              _active={{
                transform: "scale(0.95)",
              }}
              transitionDuration={"0.2s"}
              onClick={handleSavePubOutAmt}
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
