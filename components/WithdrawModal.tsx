import {
  Box,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Step,
  StepDescription,
  StepIndicator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  useToast,
  Text,
  Flex,
  Button,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import {
  generateCommitment,
  generateNullifier,
  indicesToPathIndices,
  toHashedSalt,
} from "../lib/cipher/CipherHelper";
import SimpleBtn from "./SimpleBtn";
import { TokenConfig } from "../type";
import { formatUnits } from "viem";
import { CipherTreeProviderContext } from "../providers/CipherTreeProvider";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../configs/tokenConfig";
import { CipherTransferableCoin } from "../lib/cipher/CipherCoin";
import { CipherTree } from "../lib/cipher/CipherTree";
import { generateCipherTx } from "../lib/cipher/CipherCore";
import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import CipherAbi from "../lib/cipher/CipherAbi.json";
import dayjs from "dayjs";
import {
  ProofStruct,
  PublicInfoStruct,
} from "../lib/cipher/types/CipherContract.type";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { ConfigContext } from "../providers/ConfigProvider";

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  token: TokenConfig;
  pubOutAmt: bigint;
  salt: bigint;
  random: bigint;
};

const steps = [
  { title: "Collect Data", description: "Collect data from the network" },
  { title: "Check Cipher Code", description: "Check cipher code is valid" },
  { title: "Generate Proof", description: "Generate proof for withdraw" },
];

export default function WithdrawModal(props: Props) {
  const { isOpen, onOpen, onClose, token, pubOutAmt, salt, random } = props;
  const toast = useToast();
  const { address } = useAccount();
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [proof, setProof] = useState<ProofStruct>();
  const [publicInfo, setPublicInfo] = useState<PublicInfoStruct>();
  const { activeStep, setActiveStep, goToNext } = useSteps({
    index: 0,
    count: steps.length,
  });
  const [failedStep, setFailedStep] = useState<number>(-1);
  const {
    syncAndGetCipherTree: syncTree,
    getTreeDepth,
    getIsNullified,
    syncAndGetCipherTree,
    getContractTreeRoot,
    getUnPaidIndexFromTree,
  } = useContext(CipherTreeProviderContext);
  const { cipherContractInfo } = useContext(ConfigContext);

  const { config: withdrawConfig } = usePrepareContractWrite({
    address: cipherContractInfo?.cipherContractAddress,
    abi: CipherAbi.abi,
    functionName: "cipherTransact",
    args: [proof, publicInfo],
    value: 0n,
    enabled: proof && publicInfo ? true : false,
  });

  const {
    data: withdrawTx,
    writeAsync: withdrawAsync,
    reset: resetWithdraw,
  } = useContractWrite(withdrawConfig);

  const { isLoading: isWithdrawing, isSuccess: isWithdrawSuccess } =
    useWaitForTransaction({
      hash: withdrawTx?.hash,
    });

  const handleCloseModal = () => {
    setIsChecked(false);
    setProof(undefined);
    setPublicInfo(undefined);
    setActiveStep(0);
    setFailedStep(-1);
    resetWithdraw();
    onClose();
  };

  const handleWithdraw = async () => {
    if (!proof || !publicInfo) {
      throw new Error("proof or publicInfo is undefined");
    }
    try {
      await withdrawAsync?.();
    } catch (err) {
      toast({
        title: "Withdraw failed",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  useEffect(() => {
    if (isWithdrawSuccess) {
      toast({
        title: "Withdraw success",
        description: `Withdraw ${formatUnits(pubOutAmt, token.decimals)} ${
          token.symbol
        } success`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      handleCloseModal();
    }
  }, [isWithdrawSuccess]);

  useEffect(() => {
    if (isChecked) {
      handleSteps();
    }
  }, [isChecked]);

  const handleSteps = async () => {
    let tree: CipherTree;
    try {
      const { promise, context } = await syncAndGetCipherTree(token.address);
      // TODO: wait for tree sync
      const cache = await promise;

      tree = cache.cipherTree;
      const root = cache.cipherTree.root;
      const contractRoot = await getContractTreeRoot(token.address);
      if (root !== contractRoot) {
        throw new Error("Tree root invalid");
      }
      setActiveStep(1);
    } catch (error: any) {
      toast({
        title: "Sync cipher tree failed",
        description: error.message,
        status: "error",
        duration: 5000,
        position: "top",
        isClosable: true,
      });
      setFailedStep(0);
      return;
    }

    const commitment = generateCommitment({
      amount: pubOutAmt,
      salt: salt,
      random: random,
    });

    // if (coinLeafIndexs.length === 0) {
    //   toast({
    //     title: "Commitment is not found",
    //     description: "",
    //     status: "error",
    //     duration: 5000,
    //     position: "top",
    //     isClosable: true,
    //   });
    //   setFailedStep(1);
    //   return;
    // }
    let coinLeafIndex = -1;
    try {
      coinLeafIndex = await getUnPaidIndexFromTree(tree, commitment, salt);
    } catch (error: any) {
      toast({
        title: "Cipher code is used",
        description: "",
        status: "error",
        duration: 5000,
        position: "top",
        isClosable: true,
      });
      setFailedStep(1);
      return;
    }

    try {
      setActiveStep(2);
      const payableCoin = new CipherTransferableCoin(
        {
          key: {
            hashedSaltOrUserId: toHashedSalt(salt),
            inSaltOrSeed: salt,
            inRandom: random,
          },
          amount: pubOutAmt,
        },
        tree,
        coinLeafIndex
      );
      const withdrawTx = await generateCipherTx(
        tree,
        {
          publicInAmt: 0n,
          publicOutAmt: pubOutAmt,
          privateInCoins: [payableCoin],
          privateOutCoins: [],
        },
        {
          maxAllowableFeeRate: "0",
          recipient: address as string,
          token: tree.tokenAddress,
          deadline: dayjs().add(1, "month").unix().toString(),
        }
      );

      setProof(withdrawTx.contractCalldata.utxoData);
      setPublicInfo(withdrawTx.contractCalldata.publicInfo);
      setActiveStep(3);
    } catch (error: any) {
      toast({
        title: "Generate proof failed",
        description: error.message,
        status: "error",
        duration: 5000,
        position: "top",
        isClosable: true,
      });
      setFailedStep(2);
      return;
    }
  };

  return (
    <Modal isOpen={isOpen} size={"md"} onClose={handleCloseModal}>
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
            color: "#6B39AB",
            bgColor: "white",
          }}
          _active={{
            color: "#6B39AB",
            bgColor: "white",
          }}
        />
        <ModalBody>
          <Flex className="px-2 flex flex-row justify-between">
            <p>Amount: </p>
            <p>
              {formatUnits(pubOutAmt, token.decimals)} {token.symbol}
            </p>
          </Flex>
          <Checkbox
            className="my-6 mx-2"
            defaultChecked={isChecked}
            onChange={(e) => {
              setIsChecked(e.target.checked);
              setActiveStep(0);
            }}
            colorScheme="red"
            color="rgba(255, 157, 169, 1)"
          >
            I am sure to withdraw
          </Checkbox>
          {isChecked ? (
            <Stepper
              index={activeStep}
              orientation="vertical"
              height="200"
              gap="0"
              colorScheme="whiteAlpha"
              className="my-4"
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
                </Step>
              ))}
            </Stepper>
          ) : null}
        </ModalBody>
        {isChecked ? (
          <ModalFooter>
            <Button
              className="mx-auto w-full font-extrabold py-6 mt-6"
              borderRadius="full"
              bgColor={
                activeStep !== 3 || isWithdrawing || isWithdrawSuccess
                  ? "whiteAlpha.400"
                  : "white"
              }
              textColor={
                activeStep !== 3 || isWithdrawing || isWithdrawSuccess
                  ? "white"
                  : "black"
              }
              _hover={
                activeStep !== 3 || isWithdrawing || isWithdrawSuccess
                  ? { cursor: "not-allowed" }
                  : {
                      transform: "scale(1.05)",
                      textColor: "#6B39AB",
                    }
              }
              _active={
                activeStep !== 3 || isWithdrawing || isWithdrawSuccess
                  ? { cursor: "not-allowed" }
                  : {
                      transform: "scale(0.95)",
                    }
              }
              onClick={
                activeStep !== 3 || isWithdrawing || isWithdrawSuccess
                  ? () => {}
                  : handleWithdraw
              }
            >
              {isWithdrawing ? (
                <Spinner size="md" color="whiteAlpha.500" />
              ) : isWithdrawSuccess ? (
                "Success"
              ) : (
                "Withdraw"
              )}
            </Button>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
