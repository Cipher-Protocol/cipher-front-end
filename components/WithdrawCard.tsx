import { Flex, UseToastOptions, useToast } from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import { TokenConfig } from "../type";
import CipherCard from "./CipherCard";
import SimpleBtn from "./SimpleBtn";
import TokenSelector from "./TokenSelector";
import dayjs from "dayjs";
import { utils, BigNumber } from "ethers";
import { CIPHER_CONTRACT_ADDRESS } from "../configs/tokenConfig";
import { CipherTransferableCoin } from "../lib/cipher/CipherCoin";
import { generateCipherTx } from "../lib/cipher/CipherCore";
import { CipherTree } from "../lib/cipher/CipherTree";
import { PoseidonHash } from "../lib/poseidonHash";
import {
  decodeCipherCode,
  generateCommitment,
  generateNullifier,
  indicesToPathIndices,
} from "../lib/cipher/CipherHelper";
import { CipherTreeProviderContext } from "../providers/CipherTreeProvider";
import { useAccount } from "wagmi";
import { writeContract } from "@wagmi/core";
import CipherAbi from "../assets/Cipher-abi.json";
import { DEFAULT_LEAF_ZERO_VALUE } from "../lib/cipher/CipherConfig";

type Props = {
  tokens: TokenConfig[];
  isLoadingTokens?: boolean;
};

export default function WithdrawCard(props: Props) {
  const { tokens, isLoadingTokens } = props;
  const toast = useToast();
  const { address } = useAccount();

  const [selectedToken, setSelectedToken] = useState<TokenConfig>(tokens[0]);
  const {
    syncTree,
    getTreeDepth: syncTreeDepth,
    getIsNullified,
  } = useContext(CipherTreeProviderContext);

  const [cipherCode, setCipherCode] = useState<string>("");
  useEffect(() => {
    console.log({
      tokens,
    });
    if (!tokens) return;
    setSelectedToken(tokens[0]);
  }, [tokens]);

  const onValueChange = (value: string) => {
    setCipherCode(value);
  };

  const doSyncTree = async (tokenAddress: string) => {
    // Sync Tree
    const depth = await syncTreeDepth(CIPHER_CONTRACT_ADDRESS, tokenAddress);
    const tree = new CipherTree({
      depth: depth,
      zeroLeaf: DEFAULT_LEAF_ZERO_VALUE,
      tokenAddress,
    });
    // TODO
    tree.addCommitments([
      "0x2f27ea3c4e9633eba4cdd42f6a78fcf1d211ba197e9a6d1c466a1628eedc74da",
      "0x18c537e9a0e8c9331a8aad7a004ae2bd19d4222e52f4afbe20cc1177121d483c",
      "0x04fc3398d9de5e1b96cf9e536080df014d80821a05d4ed846ec702590b6655f2",
    ]);
    return tree;
  };

  const doProveAndSendTx = async (
    tree: CipherTree,
    payableCoin: CipherTransferableCoin
  ) => {
    const withdrawTx = await generateCipherTx(
      tree,
      {
        publicInAmt: 0n,
        publicOutAmt: payableCoin.coinInfo.amount,
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
    console.log({
      withdrawTx,
    });

    const receipt = await writeContract({
      address: CIPHER_CONTRACT_ADDRESS,
      abi: CipherAbi.abi,
      functionName: "cipherTransact",
      args: [
        withdrawTx.contractCalldata.utxoData,
        withdrawTx.contractCalldata.publicInfo,
      ],
    });
    console.log({
      receipt,
    });
  };

  const withdraw = async () => {
    try {
      const { tokenAddress, amount, salt, random } =
        decodeCipherCode(cipherCode);

      // Validate data
      const { error: cipherCodeError } = validateCipherCodeData(toast, {
        selectedToken,
        tokenAddress,
        amount,
        salt,
        random,
      });
      if (cipherCodeError) {
        return toast(cipherCodeError);
      }

      const tree = await doSyncTree(tokenAddress);

      const commitment = generateCommitment({
        amount: amount.toBigInt(),
        salt: salt.toBigInt(),
        random: random.toBigInt(),
      });
      const coinLeafIndexs = tree.findLeafIndexsByCommitment(commitment);
      if (coinLeafIndexs.length === 0) {
        throw new Error("Commitment is not found");
      }
      let coinLeafIndex = -1;
      for (let index = 0; index < coinLeafIndexs.length; index++) {
        const leafIndex = coinLeafIndexs[index];
        const mkp = tree.genMerklePath(leafIndex);
        const indices = indicesToPathIndices(mkp.indices);
        const nullifier = generateNullifier(
          commitment,
          indices,
          salt.toBigInt()
        );
        const isPaid = await getIsNullified(
          CIPHER_CONTRACT_ADDRESS,
          tokenAddress,
          nullifier
        );
        if (!isPaid) {
          coinLeafIndex = leafIndex;
          break;
        }
      }
      if (coinLeafIndex === -1) {
        throw new Error("Commitment is already paid");
      }
      const payableCoin = new CipherTransferableCoin(
        {
          key: {
            hashedSaltOrUserId: PoseidonHash([salt.toBigInt()]),
            inSaltOrSeed: salt.toBigInt(),
            inRandom: random.toBigInt(),
          },
          amount: amount.toBigInt(),
        },
        tree,
        coinLeafIndexs[0]
      );

      await doProveAndSendTx(tree, payableCoin);
    } catch (error: any) {
      console.error({
        error,
      });
      toast({
        title: "Withdraw failed",
        description: error.message,
        status: "error",
        duration: 10000,
        isClosable: true,
      });
    }
  };
  return (
    <Flex className="p-8 flex flex-col justify-between items-center gap-8 h-[20rem] w-[25rem] rounded-3xl shadow-md bg-slate-300 m-8">
      <TokenSelector
        tokens={tokens}
        selectedToken={selectedToken}
        isLoadingTokens={isLoadingTokens}
        setSelectedToken={setSelectedToken}
      />
      <Flex className="w-[20rem]">
        <CipherCard
          placeholder="Enter your cipher here"
          onValueChange={onValueChange}
        />
      </Flex>
      <SimpleBtn
        colorScheme={"teal"}
        className="w-56"
        onClick={() => withdraw()}
      >
        Withdraw
      </SimpleBtn>
    </Flex>
  );
}

function validateCipherCodeData(
  toast: any,
  {
    selectedToken,
    tokenAddress,
    amount,
    salt,
    random,
  }: {
    selectedToken: TokenConfig | undefined;
    tokenAddress: string;
    amount: BigNumber;
    salt: BigNumber;
    random: BigNumber;
  }
) {
  let error: UseToastOptions | null = null;
  if (tokenAddress !== selectedToken?.address) {
    error = {
      title: "Token address is not match",
      description: "Please check your token address",
      status: "error",
      duration: 5000,
      isClosable: true,
    };
  }
  if (amount.eq(0)) {
    error = {
      title: "Amount is zero",
      description: "Please check your amount",
      status: "error",
      duration: 5000,
      isClosable: true,
    };
  }
  if (salt.eq(0)) {
    error = {
      title: "Salt is zero",
      description: "Please check your salt",
      status: "error",
      duration: 5000,
      isClosable: true,
    };
  }
  if (random.eq(0)) {
    error = {
      title: "Random is zero",
      description: "Please check your random",
      status: "error",
      duration: 5000,
      isClosable: true,
    };
  }
  return {
    error,
  };
}
