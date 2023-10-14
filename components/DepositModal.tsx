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
import React, { useContext, useState } from "react";
import { TokenConfig } from "../type";
import SimpleBtn from "./SimpleBtn";
import CipherCard from "./CipherCard";
import dayjs from "dayjs";
import { CipherBaseCoin, CipherCoinInfo, CipherTransferableCoin } from "../lib/cipher/CipherCoin";
import { ethTokenAddress, generateCipherTx } from "../lib/cipher/CipherCore";
import { CipherTree } from "../lib/cipher/CipherTree";
import { getDefaultLeaf } from "../lib/cipher/CipherHelper";
import { erc20ABI, useAccount } from "wagmi";
import { writeContract } from "@wagmi/core";
import { CipherTreeProviderContext } from "../providers/CipherTreeProvider";
import { CIPHER_CONTRACT_ADDRESS, DEFAULT_ETH_ADDRESS } from "../configs/tokenConfig";
import CipherAbi from '../assets/Cipher-abi.json';
import { PoseidonHash } from "../lib/poseidonHash";

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  pubInAmt?: BigNumber;
  token?: TokenConfig;
  cipherCode: string;
  cipherCoinInfo: CipherCoinInfo,
};

const steps = [
  { title: "Collect Data", description: "Collect data from the network" },
  { title: "Approve Token", description: "Approve token for deposit" },
  { title: "Generate Proof", description: "Generate proof for deposit" },
];

export default function DepositModal(props: Props) {
  const { isOpen, onOpen, onClose, pubInAmt, token, cipherCode: cipherHex, cipherCoinInfo } = props;
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { address } = useAccount();
  const { activeStep } = useSteps({
    index: 1,
    count: steps.length,
  });
  const { syncTree, getTreeDepth: syncTreeDepth } = useContext(CipherTreeProviderContext);
  if (!pubInAmt || !token) return null;

  const handleCloseModal = () => {
    setIsDownloaded(false);
    onClose();
  };


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

  const approveToken = async () => {
    const receipt = await writeContract({
      address: token.address,
      abi: erc20ABI,
      functionName: 'approve',
      args: [CIPHER_CONTRACT_ADDRESS, pubInAmt.toBigInt()],
    })
    console.log(approveToken, {
      receipt,
    })
  }

  const initToken = async () => {
    const receipt = await writeContract({
      address: CIPHER_CONTRACT_ADDRESS,
      abi: CipherAbi.abi,
      functionName: 'initTokenTree',
      args: [token.address],
    })
    console.log('approveToken', {
      receipt,
    })
  }

  const generateProof = async () => {
    const depth = await syncTreeDepth(CIPHER_CONTRACT_ADDRESS, token.address);
    console.log({
      depth
    })
    if(depth === 0) {
      throw new Error(`${token.address} tree is not initialized`);
    }
    // TODO: generate cipher tree
    const tree = new CipherTree({
      depth: depth,
      zeroLeaf: getDefaultLeaf(token.address).toString(),
      tokenAddress: token.address,
    })
    if(!address) {
      throw new Error("address is undefined");
    }
    const coinLeafId = 0;
    const tx = await generateCipherTx(
      tree,
      {
        publicInAmt: pubInAmt.toBigInt(),
        publicOutAmt: 0n,
        privateInCoins: [],
        // TODO: get leafId
        privateOutCoins: [new CipherBaseCoin(cipherCoinInfo, coinLeafId)],
      }, {
        // TODO: get maxAllowableFeeRate from relay info
        maxAllowableFeeRate: "0",
        recipient: address,
        token: token.address,
        deadline: "2524579200",
      }
    );
    
    console.log({
      tx,
    })
    const { utxoData, publicInfo } = tx.contractCalldata;

    const receipt = await writeContract({
      address: CIPHER_CONTRACT_ADDRESS,
      abi: CipherAbi.abi,
      functionName: 'cipherTransact',
      args: [utxoData, publicInfo],
      value: token.address === DEFAULT_ETH_ADDRESS ? BigNumber.from(pubInAmt.toString()).toBigInt() : 0n,
    })
    console.log({
      receipt,
    })
  }


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
            <SimpleBtn colorScheme="blue" className="mx-auto w-40" onClick={() => initToken()}>
            initToken
            </SimpleBtn>
            <SimpleBtn colorScheme="blue" className="mx-auto w-40" onClick={() => approveToken()}>
              Approve
            </SimpleBtn>
            <SimpleBtn colorScheme="blue" className="mx-auto w-40" onClick={() => generateProof()}>
              Deposit
            </SimpleBtn>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
