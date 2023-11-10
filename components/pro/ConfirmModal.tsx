import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Step,
  StepDescription,
  StepIndicator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  useSteps,
  useToast,
  Image,
  ModalFooter,
  Checkbox,
  Tooltip,
} from "@chakra-ui/react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { TokenConfig } from "../../type";
import {
  CipherCoinInfo,
  CipherTransferableCoin,
} from "../../lib/cipher/CipherCoin";
import { formatUnits } from "viem";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import {
  erc20ABI,
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../../configs/tokenConfig";
import { ConfigContext } from "../../providers/ConfigProvider";
import { useAllowance } from "../../hooks/useAllowance";
import { CipherTxProviderContext } from "./ProCipherTxContext";
import downloadImg1 from "../../assets/images/download1.png";
import { downloadCipher } from "../../lib/downloadCipher";

const steps = [
  { title: "Approve Token", description: "Approve token for deposit" },
  { title: "Collect Data", description: "Collect data from the network" },
  { title: "Generate Proof", description: "Generate proof for deposit" },
];

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  selectedToken: TokenConfig;
  publicInAmt: bigint;
  publicOutAmt: bigint;
  privateInCoins: Array<CipherTransferableCoin | null>;
  privateOutCoins: Array<CipherCoinInfo | null>;
};

export default function ConfirmModal(props: Props) {
  const {
    isOpen,
    onOpen,
    onClose,
    selectedToken,
    publicInAmt,
    publicOutAmt,
    privateInCoins,
    privateOutCoins,
  } = props;
  const toast = useToast();
  const { chain } = useNetwork();
  const { address } = useAccount();
  const { cipherContractInfo } = useContext(ConfigContext);
  const { prepareProof, sendTransaction } = useContext(CipherTxProviderContext);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const { activeStep, setActiveStep } = useSteps({
    index: -1,
    count: steps.length,
  });
  const [failedStep, setFailedStep] = useState<number>(-1);
  const [isApproved, setIsApproved] = useState(false);
  const { allowance, refetchAllowance } = useAllowance(
    cipherContractInfo?.cipherContractAddress,
    selectedToken.address,
    address
  );

  // prepare approve
  const { config: approveConfig } = usePrepareContractWrite({
    address: selectedToken.address,
    abi: erc20ABI,
    functionName: "approve",
    args: [
      cipherContractInfo?.cipherContractAddress! as `0x${string}`,
      publicInAmt,
    ],
    enabled:
      chain &&
      selectedToken &&
      publicInAmt &&
      selectedToken.address !== DEFAULT_NATIVE_TOKEN_ADDRESS
        ? true
        : false,
  });
  // approve
  const {
    data: approveTx,
    writeAsync: approveAsync,
    reset: resetApprove,
  } = useContractWrite(approveConfig);

  const { isLoading: isApproving, isSuccess: isApproveSuccess } =
    useWaitForTransaction({
      hash: approveTx?.hash,
    });

  const checkApproval = () => {
    if (!address) {
      return;
      // throw new Error("address is undefined");
    }

    if (selectedToken.address === DEFAULT_NATIVE_TOKEN_ADDRESS) {
      setIsApproved(true);
      setActiveStep(1);
      return;
    }
    if (allowance && allowance >= publicInAmt) {
      setIsApproved(true);
      setActiveStep(1);
    }
  };

  useEffect(() => {
    if (isOpen && isChecked && isDownloaded) {
      setActiveStep(0);
      checkApproval();
    }
  }, [isOpen, isChecked, isDownloaded]);

  useEffect(() => {
    if (isApproveSuccess) {
      checkApproval();
      setIsApproved(isApproveSuccess);
      setActiveStep(1);
      toast({
        title: "Approve success",
        description: "",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  }, [isApproveSuccess]);

  const handleApprove = async () => {
    if (!address) {
      throw new Error("address is undefined");
    }
    try {
      setFailedStep(-1);
      setActiveStep(0);
      await approveAsync?.();
    } catch (err) {
      setFailedStep(0);
      toast({
        title: "Approve failed",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const onPrepareProof = useCallback(async () => {
    setActiveStep(2);
    try {
      await prepareProof?.();
      setActiveStep(3);
    } catch (err) {
      setFailedStep(2);
      toast({
        title: "Prepare proof failed",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  }, [prepareProof]);

  useEffect(() => {
    if (isApproved) {
      onPrepareProof();
    }
  }, [isApproved]);

  const onSendTransaction = useCallback(async () => {
    await sendTransaction?.();
  }, [onPrepareProof, sendTransaction]);

  const handleIsChecked = () => {
    if (!isChecked) {
      setIsChecked(!isChecked);
    }
  };

  const handleIsDownloaded = () => {
    if (!isDownloaded) {
      setIsDownloaded(!isDownloaded);
    }
  };

  const handleCloseModal = () => {
    setIsChecked(false);
    setIsDownloaded(false);
    setActiveStep(0);
    setFailedStep(-1);
    resetApprove();
    setIsApproved(false);
    onClose();
  };

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      size="5xl"
      onClose={handleCloseModal}
    >
      <ModalOverlay />
      <ModalContent
        bgColor={"whiteAlpha.400"}
        borderRadius={"3xl"}
        className="px-8 py-4"
        color={"white"}
        backdropFilter={"blur(10px)"}
      >
        <ModalHeader fontSize={"3xl"}>Transaction details</ModalHeader>
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
          <Flex className="flex flex-row justify-between my-8 mx-4 gap-20">
            <Flex className="flex flex-col gap-4 w-full">
              <Flex className="flex flex-col justify-between">
                <Text className="font-medium text-2xl">
                  Public amount details
                </Text>
                <Flex
                  className="flex flex-row justify-between font-base text-lg"
                  textColor="whiteAlpha.600"
                >
                  <Text>Deposit amount: </Text>
                  <Text>
                    {formatUnits(publicInAmt, selectedToken.decimals)}{" "}
                    {selectedToken.symbol}
                  </Text>
                </Flex>
                <Flex
                  className="flex flex-row justify-between font-base text-lg"
                  textColor="whiteAlpha.600"
                >
                  <p>Withdraw amount: </p>
                  <p>
                    {formatUnits(publicOutAmt, selectedToken.decimals)}{" "}
                    {selectedToken.symbol}
                  </p>
                </Flex>
                <Text className="font-medium text-2xl mt-4">
                  Shield amount details
                </Text>
                <Flex
                  className="flex flex-col font-base text-lg"
                  textColor="whiteAlpha.600"
                >
                  {privateInCoins.map((coin, index) => {
                    return (
                      <Flex
                        key={index}
                        className="flex flex-row justify-between"
                      >
                        <p>Shield input amount </p>
                        <p className="">
                          {formatUnits(
                            coin?.coinInfo.amount || 0n,
                            selectedToken.decimals
                          )}{" "}
                          {selectedToken.symbol}
                        </p>
                      </Flex>
                    );
                  })}
                </Flex>
                <Flex className="flex flex-col font-base text-lg gap-2 mt-4">
                  {privateOutCoins.map((coin, index) => {
                    return (
                      <Flex key={index} className="flex flex-col">
                        <Flex
                          key={index}
                          className="flex flex-row justify-between"
                          textColor="whiteAlpha.600"
                        >
                          <Flex className="flex flex-row items-center">
                            <Tooltip
                              label="Download your cipher code and keep it safe!"
                              placement="top"
                              bgColor="white"
                              textColor="black"
                              borderRadius={"md"}
                            >
                              <Button
                                h={6}
                                bgColor="white"
                                _hover={{
                                  cursor: "pointer",
                                  transform: "scale(1.1)",
                                  bgColor: "white",
                                }}
                                _active={{
                                  transform: "scale(0.9)",
                                }}
                                transitionDuration={"0.2s"}
                                //TODO: download cipher code
                              >
                                <Image
                                  boxSize={4}
                                  src={downloadImg1.src}
                                  alt="download"
                                ></Image>
                              </Button>
                            </Tooltip>
                            <p className="mx-2">Shield output amount: </p>
                          </Flex>
                          <p>
                            {formatUnits(
                              coin?.amount || 0n,
                              selectedToken.decimals
                            )}{" "}
                            {selectedToken.symbol}
                          </p>
                        </Flex>
                        <Flex
                          className="flex flex-row justify-between text-sm"
                          color={"whiteAlpha.600"}
                        >
                          <Text>Specified recipient: </Text>
                          <Text>No specified recipient </Text>
                        </Flex>
                      </Flex>
                    );
                  })}
                </Flex>
                <Flex className="flex flex-col my-4">
                  <Checkbox
                    disabled={isChecked}
                    defaultChecked={isChecked}
                    onChange={handleIsChecked}
                    colorScheme="red"
                    color="rgba(255, 157, 169, 1)"
                  >
                    I have checked all the details are correct
                  </Checkbox>
                  <Checkbox
                    disabled={isDownloaded}
                    defaultChecked={isDownloaded}
                    onChange={handleIsDownloaded}
                    colorScheme="red"
                    color="rgba(255, 157, 169, 1)"
                  >
                    I have downloaded all cipher code
                  </Checkbox>
                </Flex>
              </Flex>
            </Flex>
            <Flex
              className="flex flex-col gap-4 w-full"
              opacity={isChecked && isDownloaded ? 1 : 0.3}
            >
              <Stepper
                index={activeStep}
                orientation="vertical"
                height="250"
                gap="0"
                colorScheme="whiteAlpha"
              >
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator
                      bgColor="whiteAlpha.500"
                      border="none"
                      boxSize="12"
                    >
                      {failedStep === index ? (
                        <StepStatus
                          complete={
                            <CloseIcon color="whiteAlpha.600" boxSize={"5"} />
                          }
                          incomplete={
                            <CloseIcon color="whiteAlpha.600" boxSize={"5"} />
                          }
                          active={
                            <CloseIcon color="whiteAlpha.600" boxSize={"5"} />
                          }
                        />
                      ) : (
                        <StepStatus
                          complete={<CheckIcon boxSize={6} />}
                          incomplete={
                            <Text fontSize={"xl"} fontWeight={600}>
                              {index + 1}
                            </Text>
                          }
                          active={
                            <Spinner
                              size="md"
                              color="whiteAlpha.500"
                              boxSize={6}
                            />
                          }
                        />
                      )}
                    </StepIndicator>

                    <Box>
                      <StepTitle>
                        <Flex fontWeight={600}>{step.title}</Flex>
                      </StepTitle>
                      <StepDescription>
                        <Flex
                          fontSize={"xs"}
                          color={"whiteAlpha.600"}
                          fontWeight={500}
                          lineHeight={"1"}
                        >
                          {step.description}
                        </Flex>
                      </StepDescription>
                    </Box>
                    {step === steps[0] ? (
                      <Button
                        className="mx-auto w-40"
                        borderRadius="full"
                        bgColor={
                          isApproved || isApproving ? "whiteAlpha.400" : "white"
                        }
                        textColor={
                          isApproved || isApproving ? "white" : "black"
                        }
                        _hover={
                          isApproved || isApproving
                            ? { cursor: "not-allowed" }
                            : {
                                transform: "scale(1.05)",
                                textColor: "brand",
                              }
                        }
                        _active={
                          isApproved || isApproving
                            ? { cursor: "not-allowed" }
                            : {
                                transform: "scale(0.95)",
                              }
                        }
                        onClick={
                          isApproved || isApproving ? undefined : handleApprove
                        }
                      >
                        {isApproving ? (
                          <Spinner size="sm" color="whiteAlpha.500" />
                        ) : isApproved ? (
                          "Approved"
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    ) : null}
                  </Step>
                ))}
              </Stepper>
            </Flex>
          </Flex>
          <ModalFooter>
            <Button
              className="w-1/2 py-6 m-auto"
              borderRadius="full"
              textColor={activeStep === 3 ? "black" : "whiteAlpha.400"}
              bgColor={activeStep === 3 ? "white" : "whiteAlpha.400"}
              _hover={
                activeStep === 3
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
                activeStep === 3
                  ? {
                      transform: "scale(0.95)",
                    }
                  : {
                      cursor: "not-allowed",
                    }
              }
              transitionDuration={"0.2s"}
              onClick={activeStep === 3 ? onSendTransaction : undefined}
            >
              Send transaction
            </Button>
          </ModalFooter>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
