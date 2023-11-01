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
} from "@chakra-ui/react";
import { utils } from "ethers";
import React, { useContext, useEffect, useState } from "react";
import { TokenConfig } from "../../type";
import CipherCard from "../shared/CipherCard";
import dayjs from "dayjs";
import { CipherBaseCoin, CipherCoinInfo } from "../../lib/cipher/CipherCoin";
import { generateCipherTx } from "../../lib/cipher/CipherCore";
import { CipherTree } from "../../lib/cipher/CipherTree";
import { erc20ABI, useAccount, useNetwork, useWaitForTransaction } from "wagmi";
import { usePrepareContractWrite, useContractWrite } from "wagmi";
import { CipherTreeProviderContext } from "../../providers/CipherTreeProvider";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../../configs/tokenConfig";
import CipherAbi from "../../lib/cipher/CipherAbi.json";
import {
  ProofStruct,
  PublicInfoStruct,
} from "../../lib/cipher/types/CipherContract.type";
import { useAllowance } from "../../hooks/useAllowance";
import { downloadCipher } from "../../lib/downloadCipher";
import { assert } from "../../lib/helper";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { ConfigContext } from "../../providers/ConfigProvider";
import SimpleBtn from "../shared/SimpleBtn";

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  pubInAmt: bigint;
  token: TokenConfig;
  cipherCode: string;
  cipherCoinInfo: CipherCoinInfo;
  setCipherCoinInfo: React.Dispatch<React.SetStateAction<CipherCoinInfo>>;
};

const steps = [
  { title: "Approve Token", description: "Approve token for deposit" },
  { title: "Collect Data", description: "Collect data from the network" },
  { title: "Generate Proof", description: "Generate proof for deposit" },
];

export default function DepositModal(props: Props) {
  const {
    isOpen,
    onOpen,
    onClose,
    pubInAmt,
    token,
    cipherCode: cipherHex,
    cipherCoinInfo,
    setCipherCoinInfo,
  } = props;
  const toast = useToast();
  const { chain } = useNetwork();
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [proof, setProof] = useState<ProofStruct>();
  const [publicInfo, setPublicInfo] = useState<PublicInfoStruct>();
  const { address } = useAccount();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  const [failedStep, setFailedStep] = useState<number>(-1);
  const { getTreeDepth, syncAndGetCipherTree, getContractTreeRoot } =
    useContext(CipherTreeProviderContext);
  const { cipherContractInfo } = useContext(ConfigContext);
  const { allowance, refetchAllowance } = useAllowance(
    cipherContractInfo?.cipherContractAddress,
    token.address,
    address
  );

  const handleCloseModal = () => {
    setIsDownloaded(false);
    setIsApproved(false);
    setProof(undefined);
    setPublicInfo(undefined);
    setActiveStep(0);
    setFailedStep(-1);
    resetApprove();
    resetDeposit();
    onClose();
    setCipherCoinInfo({
      key: {
        hashedSaltOrUserId: 0n,
        inSaltOrSeed: 0n,
        inRandom: 0n,
      },
      amount: 0n,
    });
  };

  // prepare approve
  const { config: approveConfig } = usePrepareContractWrite({
    address: token.address,
    abi: erc20ABI,
    functionName: "approve",
    args: [
      cipherContractInfo?.cipherContractAddress! as `0x${string}`,
      pubInAmt,
    ],
    enabled:
      chain &&
      token &&
      pubInAmt &&
      token.address !== DEFAULT_NATIVE_TOKEN_ADDRESS
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

  const { config: depositConfig } = usePrepareContractWrite({
    address: cipherContractInfo?.cipherContractAddress,
    abi: CipherAbi.abi,
    functionName: "cipherTransact",
    args: [proof, publicInfo],
    value: token.address === DEFAULT_NATIVE_TOKEN_ADDRESS ? pubInAmt : 0n,
    enabled: proof && publicInfo ? true : false,
  });

  const {
    data: depositTx,
    writeAsync: depositAsync,
    reset: resetDeposit,
  } = useContractWrite(depositConfig);

  const { isLoading: isDepositing, isSuccess: isDepositSuccess } =
    useWaitForTransaction({
      hash: depositTx?.hash,
    });

  // // prepare initTokenTree
  // const { config: initTokenTreeConfig } = usePrepareContractWrite({
  //   address: cipherContractInfo?.cipherContractAddress,
  //   abi: CipherAbi.abi,
  //   functionName: "initTokenTree",
  //   args: [token.address],
  //   enabled: true,
  // });
  // // initTokenTree
  // const { write: initTokenTree } = useContractWrite(initTokenTreeConfig);

  const handleDownload = () => {
    downloadCipher(cipherHex);
    // delay 1 second
    setTimeout(() => {
      setIsDownloaded(true);
    }, 1000);
  };

  useEffect(() => {
    if (isDownloaded) {
      checkApproval();
    }
  }, [isDownloaded]);

  useEffect(() => {
    if (isApproved) {
      collectData();
    }
  }, [isApproved]);

  const checkApproval = () => {
    if (!address) {
      throw new Error("address is undefined");
    }
    if (token.address === DEFAULT_NATIVE_TOKEN_ADDRESS) {
      setIsApproved(true);
      setActiveStep(1);
      return;
    }
    if (allowance && allowance >= pubInAmt) {
      setIsApproved(true);
      setActiveStep(1);
    }
  };

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

  useEffect(() => {
    if (isDepositSuccess) {
      toast({
        title: "Deposit success",
        description: `Deposit ${utils.formatUnits(pubInAmt, token.decimals)} ${
          token.symbol
        } success`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      handleCloseModal();
    }
  }, [isDepositSuccess]);

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

  const collectData = async () => {
    try {
      const depth = await getTreeDepth(token.address);
      if (depth === 0) {
        throw new Error(`${token.address} tree is not initialized`);
      }
      // TODO: generate cipher tree
      const { promise, context } = await syncAndGetCipherTree(token.address);
      const cache = await promise;
      const root = cache.cipherTree.root;
      const contractRoot = await getContractTreeRoot(token.address);
      assert(root === contractRoot, "root is not equal");
      setActiveStep(2);

      try {
        await genProof(cache.cipherTree);
      } catch (err) {
        toast({
          title: "Generate proof failed",
          description: "",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        setFailedStep(2);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Collect data failed",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      setFailedStep(1);
    }
  };

  const genProof = async (tree: CipherTree) => {
    if (!address) {
      throw new Error("address is undefined");
    }
    const tx = await generateCipherTx(
      tree,
      {
        publicInAmt: pubInAmt,
        publicOutAmt: 0n,
        privateInCoins: [],
        // TODO: get leafId
        privateOutCoins: [new CipherBaseCoin(cipherCoinInfo)],
      },
      {
        // TODO: get maxAllowableFeeRate from relay info
        maxAllowableFeeRate: "0",
        recipient: address,
        token: token.address,
        deadline: dayjs().add(1, "month").unix().toString(),
      }
    );
    const { utxoData, publicInfo } = tx.contractCalldata;
    setProof(utxoData);
    setPublicInfo(publicInfo);
    setActiveStep(3);
    return {
      utxoData,
      publicInfo,
    };
  };

  const handleDeposit = async () => {
    if (!proof || !publicInfo) {
      throw new Error("proof or publicInfo is undefined");
    }
    try {
      await depositAsync?.();
    } catch (err) {
      toast({
        title: "Deposit failed",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      size={"md"}
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
        <ModalHeader fontSize={"3xl"}>Deposit</ModalHeader>
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
              {utils.formatUnits(pubInAmt, token.decimals)} {token.symbol}
            </p>
          </Flex>
          <Flex className="flex flex-col my-2 items-center">
            <CipherCard value={cipherHex} />
            <Flex
              fontSize={"xs"}
              fontWeight={"bold"}
              className="flex flex-col w-full my-4"
              color="rgba(255, 157, 169, 1)"
            >
              <p className="px-2 my-2 font-normal">
                Download cipher code and save it in a safe place!
              </p>
              <Button
                colorScheme="blue"
                className="w-full text-base py-6"
                borderRadius={"full"}
                bgColor="white"
                textColor="black"
                _hover={{
                  transform: "scale(1.05)",
                  textColor: "#6B39AB",
                }}
                _active={{
                  transform: "scale(0.95)",
                }}
                onClick={() => handleDownload()}
              >
                Download
              </Button>
            </Flex>
          </Flex>
          {isDownloaded ? (
            <Stepper
              index={activeStep}
              orientation="vertical"
              height="200"
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
                      textColor={isApproved ? "white" : "black"}
                      _hover={
                        isApproved
                          ? { cursor: "not-allowed" }
                          : {
                              transform: "scale(1.05)",
                              textColor: "#6B39AB",
                            }
                      }
                      _active={
                        isApproved
                          ? { cursor: "not-allowed" }
                          : {
                              transform: "scale(0.95)",
                            }
                      }
                      onClick={isApproved ? undefined : handleApprove}
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
          ) : null}
        </ModalBody>

        {isDownloaded ? (
          <ModalFooter>
            {/* <SimpleBtn
              colorScheme="blue"
              className="mx-auto w-40"
              onClick={() => initTokenTree?.()}
            >
              initToken
            </SimpleBtn> */}
            <Button
              disabled={activeStep !== 3 || isDepositing || isDepositSuccess}
              className="mx-auto w-full font-extrabold py-6 mt-6"
              borderRadius="full"
              bgColor={
                activeStep !== 3 || isDepositing || isDepositSuccess
                  ? "whiteAlpha.400"
                  : "white"
              }
              textColor={
                activeStep !== 3 || isDepositing || isDepositSuccess
                  ? "white"
                  : "black"
              }
              _hover={
                activeStep !== 3 || isDepositing || isDepositSuccess
                  ? { cursor: "not-allowed" }
                  : {
                      transform: "scale(1.05)",
                      textColor: "#6B39AB",
                    }
              }
              _active={
                activeStep !== 3 || isDepositing || isDepositSuccess
                  ? { cursor: "not-allowed" }
                  : {
                      transform: "scale(0.95)",
                    }
              }
              onClick={
                activeStep !== 3 || isDepositing || isDepositSuccess
                  ? () => {}
                  : handleDeposit
              }
            >
              {isDepositing ? (
                <Spinner size="md" color="whiteAlpha.500" />
              ) : isDepositSuccess ? (
                "Success"
              ) : (
                "Deposit"
              )}
            </Button>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
