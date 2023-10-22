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
  Spinner,
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
  useToast,
} from "@chakra-ui/react";
import { utils } from "ethers";
import React, { useContext, useEffect, useState } from "react";
import { TokenConfig } from "../type";
import SimpleBtn from "./SimpleBtn";
import CipherCard from "./CipherCard";
import dayjs from "dayjs";
import { CipherBaseCoin, CipherCoinInfo } from "../lib/cipher/CipherCoin";
import { generateCipherTx } from "../lib/cipher/CipherCore";
import { CipherTree } from "../lib/cipher/CipherTree";
import { erc20ABI, useAccount, useWaitForTransaction } from "wagmi";
import { usePrepareContractWrite, useContractWrite } from "wagmi";
import { CipherTreeProviderContext } from "../providers/CipherTreeProvider";
import {
  CIPHER_CONTRACT_ADDRESS,
  DEFAULT_NATIVE_TOKEN_ADDRESS,
} from "../configs/tokenConfig";
import CipherAbi from "../lib/cipher/CipherAbi.json";
import {
  ProofStruct,
  PublicInfoStruct,
} from "../lib/cipher/types/CipherContract.type";
import { useAllowance } from "../hooks/useAllowance";
import { downloadCipher } from "../lib/downloadCipher";
import { assert } from "../lib/helper";
import { CloseIcon } from "@chakra-ui/icons";

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  pubInAmt: bigint;
  token: TokenConfig;
  cipherCode: string;
  cipherCoinInfo: CipherCoinInfo;
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
  } = props;
  const toast = useToast();
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
  const { allowance, refetchAllowance } = useAllowance(token.address, address);

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
  };

  // prepare approve
  const { config: approveConfig } = usePrepareContractWrite({
    address: token.address,
    abi: erc20ABI,
    functionName: "approve",
    args: [CIPHER_CONTRACT_ADDRESS, pubInAmt],
    enabled:
      token && pubInAmt && token.address !== DEFAULT_NATIVE_TOKEN_ADDRESS
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
    address: CIPHER_CONTRACT_ADDRESS,
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
  //   address: CIPHER_CONTRACT_ADDRESS,
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
      const depth = await getTreeDepth(CIPHER_CONTRACT_ADDRESS, token.address);
      if (depth === 0) {
        throw new Error(`${token.address} tree is not initialized`);
      }
      // TODO: generate cipher tree
      const { promise, context } = await syncAndGetCipherTree(token.address);
      const cache = await promise;
      const root = cache.cipherTree.root;
      const contractRoot = await getContractTreeRoot(
        CIPHER_CONTRACT_ADDRESS,
        token.address
      );
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
    } catch (err) {
      toast({
        title: "Collect data failed",
        description: "",
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
                    {failedStep === index ? (
                      <StepStatus
                        complete={<CloseIcon />}
                        incomplete={<CloseIcon color="red.500" />}
                        active={<CloseIcon color="red.500" />}
                      />
                    ) : (
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<Spinner size="md" color="blue.500" />}
                      />
                    )}
                  </StepIndicator>

                  <Box>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </Box>
                  {step === steps[0] ? (
                    <SimpleBtn
                      disabled={isApproved || isApproving || isApproveSuccess}
                      colorScheme={isApproved ? "teal" : "blue"}
                      className="mx-auto w-40"
                      onClick={() => handleApprove()}
                    >
                      {isApproving ? (
                        <Spinner size="sm" color="white" />
                      ) : isApproved ? (
                        "Approved"
                      ) : (
                        "Approve"
                      )}
                    </SimpleBtn>
                  ) : null}

                  <StepSeparator />
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
            <SimpleBtn
              disabled={activeStep !== 3 || isDepositing || isDepositSuccess}
              colorScheme="blue"
              className="mx-auto w-40"
              onClick={() => handleDeposit()}
            >
              {isDepositing
                ? "Depositing..."
                : isDepositSuccess
                ? "Success"
                : "Deposit"}
            </SimpleBtn>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
