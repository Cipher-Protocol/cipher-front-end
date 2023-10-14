import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import React, { useState } from "react";
import { TokenConfig } from "../type";
import SimpleBtn from "./SimpleBtn";
import CipherCard from "./CipherCard";
import dayjs from "dayjs";

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  pubInAmt?: BigNumber;
  token?: TokenConfig;
  cipherHex: string;
};

const steps = [
  { title: "Collect Data", description: "Collect data from the network" },
  { title: "Approve Token", description: "Approve token for deposit" },
  { title: "Generate Proof", description: "Generate proof for deposit" },
];

export default function DepositModal(props: Props) {
  const { isOpen, onOpen, onClose, pubInAmt, token, cipherHex } = props;
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { activeStep } = useSteps({
    index: 1,
    count: steps.length,
  });
  if (!pubInAmt || !token) return null;

  const handleCloseModal = () => {
    setIsDownloaded(false);
    onClose();
  };

  const handleDownload = () => {
    const blob = new Blob([cipherHex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const random = Math.random().toString(36).substring(7);
    const unixTime = dayjs().unix();
    link.download = `cipher-${random}-${unixTime}.txt`;
    link.href = url;
    link.click();
    // delay 1 second
    setTimeout(() => {
      setIsDownloaded(true);
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} size={"lg"} onClose={handleCloseModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modal Title</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <p>
            Deposit {utils.formatUnits(pubInAmt, token.decimals)} {token.symbol}
          </p>
          <Flex className="my-4 items-center">
            <CipherCard value={cipherHex} />
            <SimpleBtn
              colorScheme="blue"
              className="m-auto text-base my-4"
              onClick={() => handleDownload()}
            >
              Download
            </SimpleBtn>
          </Flex>
          {isDownloaded ? (
            <Stepper
              index={activeStep}
              orientation="vertical"
              height="300px"
              gap="0"
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>

                  <Box>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>

                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          ) : null}
        </ModalBody>

        {isDownloaded ? (
          <ModalFooter>
            <SimpleBtn colorScheme="blue" className="mx-auto w-40">
              Deposit
            </SimpleBtn>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
