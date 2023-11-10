import {
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
import AmountSelector from "../shared/InputAmountSelector";
import { TokenConfig } from "../../type";

type Props = {
  balance: bigint | undefined;
  selectedToken: TokenConfig;
  publicInAmt: bigint | undefined;
  setPublicInAmt: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  resetPublicInput: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export default function PublicInputModal(props: Props) {
  const {
    balance,
    selectedToken,
    publicInAmt,
    setPublicInAmt,
    resetPublicInput,
    isOpen,
    onOpen,
    onClose,
  } = props;
  const toast = useToast();

  const handleSavePubInAmt = () => {
    if (publicInAmt === undefined || publicInAmt > balance!) {
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
    resetPublicInput();
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
        <ModalHeader fontSize={"3xl"}>Deposit</ModalHeader>
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
            <Text>Deposit {selectedToken.symbol} from your wallet</Text>
            <AmountSelector
              // amount={publicInAmt}
              onAmountChange={setPublicInAmt}
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
                textColor: "brand",
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
