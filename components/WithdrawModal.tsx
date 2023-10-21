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
import {
  CIPHER_CONTRACT_ADDRESS,
  DEFAULT_ETH_ADDRESS,
} from "../configs/tokenConfig";
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
import { CloseIcon } from "@chakra-ui/icons";

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
    getTreeDepth: syncTreeDepth,
    getIsNullified,
    syncAndGetCipherTree,
    getContractTreeRoot,
  } = useContext(CipherTreeProviderContext);

  const { config: withdrawConfig } = usePrepareContractWrite({
    address: CIPHER_CONTRACT_ADDRESS,
    abi: CipherAbi.abi,
    functionName: "cipherTransact",
    args: [proof, publicInfo],
    value: token.address === DEFAULT_ETH_ADDRESS ? pubOutAmt : 0n,
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
      const contractRoot = await getContractTreeRoot(
        CIPHER_CONTRACT_ADDRESS,
        token.address
      );
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
    const coinLeafIndexs = tree.findLeafIndexsByCommitment(commitment);
    console.log({ commitment, coinLeafIndexs });
    if (coinLeafIndexs.length === 0) {
      toast({
        title: "Commitment is not found",
        description: "",
        status: "error",
        duration: 5000,
        position: "top",
        isClosable: true,
      });
      setFailedStep(1);
      return;
    }
    let coinLeafIndex = -1;

    for (let index = 0; index < coinLeafIndexs.length; index++) {
      const leafIndex = coinLeafIndexs[index];
      console.log(`check paid: leafIndex=${leafIndex}`);
      const mkp = tree.genMerklePath(leafIndex);
      const indices = indicesToPathIndices(mkp.indices);
      const nullifier = generateNullifier(commitment, indices, salt);
      const isPaid = await getIsNullified(
        CIPHER_CONTRACT_ADDRESS,
        token.address,
        nullifier
      );
      if (!isPaid) {
        coinLeafIndex = leafIndex;
        break;
      }
    }
    if (coinLeafIndex === -1) {
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

    setActiveStep(2);
    try {
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
    <Modal isOpen={isOpen} size={"lg"} onClose={handleCloseModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modal Title</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <p>
            Withdraw {formatUnits(pubOutAmt, token.decimals)} {token.symbol}
          </p>
          <Checkbox
            className="my-4"
            defaultChecked={isChecked}
            onChange={(e) => {
              setIsChecked(e.target.checked);
              setActiveStep(0);
            }}
          >
            I want to withdraw
          </Checkbox>
          {isChecked ? (
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

                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
          ) : null}
        </ModalBody>
        {isChecked ? (
          <ModalFooter>
            <SimpleBtn
              disabled={activeStep !== 3 || isWithdrawing || isWithdrawSuccess}
              colorScheme="blue"
              className="mx-auto w-40"
              onClick={() => handleWithdraw()}
            >
              {isWithdrawing
                ? "Withdrawing..."
                : isWithdrawSuccess
                ? "Success"
                : "Withdraw"}
            </SimpleBtn>
          </ModalFooter>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
