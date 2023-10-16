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
import React, { useContext, useEffect, useState } from "react";
import { TokenConfig } from "../type";
import SimpleBtn from "./SimpleBtn";
import CipherCard from "./CipherCard";
import dayjs from "dayjs";
import { CipherBaseCoin, CipherCoinInfo } from "../lib/cipher/CipherCoin";
import { generateCipherTx } from "../lib/cipher/CipherCore";
import { CipherTree } from "../lib/cipher/CipherTree";
import { erc20ABI, useAccount } from "wagmi";
import { usePrepareContractWrite, useContractWrite } from "wagmi";
import { writeContract } from "@wagmi/core";
import { CipherTreeProviderContext } from "../providers/CipherTreeProvider";
import {
  CIPHER_CONTRACT_ADDRESS,
  DEFAULT_ETH_ADDRESS,
} from "../configs/tokenConfig";
import CipherAbi from "../assets/Cipher-abi.json";
import { DEFAULT_LEAF_ZERO_VALUE } from "../lib/cipher/CipherConfig";
import {
  ProofStruct,
  PublicInfoStruct,
} from "../lib/cipher/types/CipherContract.type";

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  pubInAmt: BigNumber;
  token: TokenConfig;
  cipherCode: string;
  cipherCoinInfo: CipherCoinInfo;
};

const steps = [
  { title: "Collect Data", description: "Collect data from the network" },
  { title: "Approve Token", description: "Approve token for deposit" },
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
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isCollectedData, setIsCollectedData] = useState(false);
  const [tree, setTree] = useState<CipherTree | undefined>(undefined);
  const [isApproved, setIsApproved] = useState(false);
  const [proof, setProof] = useState<ProofStruct>();
  const [publicInfo, setPublicInfo] = useState<PublicInfoStruct>();
  const { address } = useAccount();
  const { activeStep } = useSteps({
    index: 1,
    count: steps.length,
  });
  const { syncTree, getTreeDepth, getTreeNextLeafIndex } = useContext(
    CipherTreeProviderContext
  );

  const handleCloseModal = () => {
    setIsDownloaded(false);
    onClose();
  };

  // prepare approve
  const { config: approveConfig } = usePrepareContractWrite({
    address: token.address,
    abi: erc20ABI,
    functionName: "approve",
    args: [CIPHER_CONTRACT_ADDRESS, pubInAmt.toBigInt()],
    enabled: token && pubInAmt ? true : false,
  });
  // approve
  const { write: approve } = useContractWrite(approveConfig);

  // prepare initTokenTree
  const { config: initTokenTreeConfig } = usePrepareContractWrite({
    address: CIPHER_CONTRACT_ADDRESS,
    abi: CipherAbi.abi,
    functionName: "initTokenTree",
    args: [token.address],
    enabled: true,
  });
  // initTokenTree
  const { write: initTokenTree } = useContractWrite(initTokenTreeConfig);

  const handleDownload = () => {
    const random = Math.random().toString(36).substring(7);
    const blob = new Blob([cipherHex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const unixTime = dayjs().unix();
    link.download = `cipher-${random}-${unixTime}.txt`;
    link.href = url;
    link.click();
    // delay 1 second
    setTimeout(() => {
      setIsDownloaded(true);
    }, 1000);
  };

  useEffect(() => {
    if (isDownloaded) {
      collectData();
      setIsCollectedData(true);
    }
  }, [isDownloaded]);

  useEffect(() => {
    if (isCollectedData) {
      checkApprove();
    }
  }, [isCollectedData]);

  useEffect(() => {
    if (isApproved && tree) {
      genProof(tree);
    }
  }, [isApproved]);

  const checkApprove = async () => {
    if (!address) {
      throw new Error("address is undefined");
    }
    // const allowance = await getAllowance(token.address, address);
    // if (allowance.lt(pubInAmt)) {
    //   approve?.();
    // }
  };

  const collectData = async () => {
    const depth = await getTreeDepth(CIPHER_CONTRACT_ADDRESS, token.address);
    if (depth === 0) {
      throw new Error(`${token.address} tree is not initialized`);
    }
    // TODO: generate cipher tree
    const tree = new CipherTree({
      depth: depth,
      zeroLeaf: DEFAULT_LEAF_ZERO_VALUE,
      tokenAddress: token.address,
    });
    setTree(tree);
  };

  const genProof = async (tree: CipherTree) => {
    if (!address) {
      throw new Error("address is undefined");
    }
    const tx = await generateCipherTx(
      tree,
      {
        publicInAmt: pubInAmt.toBigInt(),
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
  };

  const deposit = async () => {
    if (!proof || !publicInfo) {
      throw new Error("proof or publicInfo is undefined");
    }
    const receipt = await writeContract({
      address: CIPHER_CONTRACT_ADDRESS,
      abi: CipherAbi.abi,
      functionName: "cipherTransact",
      args: [proof, publicInfo],
      value:
        token.address === DEFAULT_ETH_ADDRESS
          ? BigNumber.from(pubInAmt.toString()).toBigInt()
          : 0n,
    });
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
            <SimpleBtn
              colorScheme="blue"
              className="mx-auto w-40"
              onClick={() => initTokenTree?.()}
            >
              initToken
            </SimpleBtn>
            <SimpleBtn
              disabled={!isApproved}
              colorScheme="blue"
              className="mx-auto w-40"
              onClick={() => approve?.()}
            >
              Approve
            </SimpleBtn>
            <SimpleBtn
              disabled={true}
              colorScheme="blue"
              className="mx-auto w-40"
              onClick={() => deposit()}
            >
              Deposit
            </SimpleBtn>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
