import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  CipherBaseCoin,
  CipherCoinInfo,
  CipherTransferableCoin,
} from "../../lib/cipher/CipherCoin";
import { useToast } from "@chakra-ui/react";
import { CipherTreeProviderContext } from "../../providers/CipherTreeProvider";
import { generateCipherTx } from "../../lib/cipher/CipherCore";
import {
  ProofStruct,
  PublicInfoStruct,
} from "../../lib/cipher/types/CipherContract.type";
import dayjs from "dayjs";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { ConfigContext } from "../../providers/ConfigProvider";
import CipherAbi from "../../lib/cipher/CipherAbi.json";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../../configs/tokenConfig";
import { downloadCipher } from "../../lib/downloadCipher";
import { encodeCipherCode } from "../../lib/cipher/CipherHelper";

export const CipherTxProviderContext = createContext<{
  publicInAmt: bigint;
  setPublicInAmt: Dispatch<SetStateAction<bigint>>;
  publicOutAmt: bigint;
  setPublicOutAmt: Dispatch<SetStateAction<bigint>>;
  privateInCoins: Array<CipherTransferableCoin | null>;
  setPrivateInCoins: (coins: Array<CipherTransferableCoin | null>) => void;
  privateOutCoins: Array<CipherCoinInfo | null>;
  setPrivateOutCoins: (coins: Array<CipherCoinInfo | null>) => void;
  recipient: string | null;
  setRecipient: (recipient: string | null) => void;
  totalPrivateInAmt: bigint;
  totalPrivateOutAmt: bigint;
  downloadCipherCodes: () => void;
  prepareProof: () => Promise<void>;
  sendTransaction: () => Promise<void>;
}>({
  publicInAmt: BigInt(0),
  setPublicInAmt: () => {},
  publicOutAmt: BigInt(0),
  setPublicOutAmt: () => {},
  privateInCoins: [],
  setPrivateInCoins: () => {},
  privateOutCoins: [],
  setPrivateOutCoins: () => {},
  recipient: "",
  setRecipient: () => {},
  totalPrivateInAmt: BigInt(0),
  totalPrivateOutAmt: BigInt(0),
  downloadCipherCodes: () => {},
  prepareProof: async () => {},
  sendTransaction: async () => {},
});

export const CipherTxProvider = ({
  tokenAddress,
  children,
}: {
  tokenAddress: string | null;
  children: React.ReactNode;
}) => {
  const toast = useToast();

  const { syncAndGetCipherTree, getUnPaidIndexFromTree } = useContext(
    CipherTreeProviderContext
  );
  const { address } = useAccount();

  const [publicInAmt, setPublicInAmt] = useState(BigInt(0));
  const [publicOutAmt, setPublicOutAmt] = useState(BigInt(0));
  const [privateInCoins, setPrivateInCoins] = useState<
    Array<CipherTransferableCoin | null>
  >([]);
  const [privateOutCoins, setPrivateOutCoins] = useState<
    Array<CipherCoinInfo | null>
  >([]);
  const [recipient, setRecipient] = useState<string | null>("");

  const isPrivateInCoinsValid = useMemo(() => {
    return privateInCoins.every((coin) => coin !== null);
  }, [privateInCoins]);

  const isPrivateOutCoinsValid = useMemo(() => {
    return privateOutCoins.every((coin) => coin !== null);
  }, [privateOutCoins]);

  const totalPrivateInAmt = useMemo(() => {
    return privateInCoins.reduce((acc, coin) => {
      if (coin === null) return acc;
      return acc + coin.coinInfo.amount;
    }, BigInt(0));
  }, [privateInCoins]);

  const totalPrivateOutAmt = useMemo(() => {
    return privateOutCoins.reduce((acc, coin) => {
      if (coin === null) return acc;
      return acc + coin.amount;
    }, BigInt(0));
  }, [privateOutCoins]);

  /** CONTRACT: cipherTransact */
  const { cipherContractInfo } = useContext(ConfigContext);
  const [utxoData, setUtxoData] = useState<ProofStruct>();
  const [publicInfo, setPublicInfo] = useState<PublicInfoStruct>();
  const { config: contractTxConfig } = usePrepareContractWrite({
    address: cipherContractInfo?.cipherContractAddress,
    abi: CipherAbi.abi,
    functionName: "cipherTransact",
    args: [utxoData, publicInfo],
    value: tokenAddress === DEFAULT_NATIVE_TOKEN_ADDRESS ? publicInAmt : 0n,
    enabled: utxoData && publicInfo ? true : false,
  });
  const {
    data: transactTx,
    writeAsync: transactASync,
    reset: transactRest,
  } = useContractWrite(contractTxConfig);

  /** */
  const validate = useCallback(() => {
    if (!tokenAddress) {
      throw new Error("Token address is not set");
    }

    if (!address) {
      throw new Error("Address is not set");
    }

    if (privateInCoins.length === 0 && privateOutCoins.length === 0) {
      throw new Error("No input and output coins");
    }

    if (!isPrivateInCoinsValid) {
      throw new Error("Invalid private input coins");
    }

    if (!isPrivateOutCoinsValid) {
      throw new Error("Invalid private output coins");
    }

    if (publicInAmt + totalPrivateInAmt !== publicOutAmt + totalPrivateOutAmt) {
      throw new Error("total IN amount and total OUT amount not match");
    }
    // if(publicOutAmt > 0 && !recipient) {
    //   throw new Error("recipient must be set if public OUT amount is greater than 0");
    // }
  }, [
    address,
    isPrivateInCoinsValid,
    isPrivateOutCoinsValid,
    privateInCoins.length,
    privateOutCoins.length,
    publicInAmt,
    publicOutAmt,
    tokenAddress,
    totalPrivateInAmt,
    totalPrivateOutAmt,
  ]);

  const downloadCipherCodes = useCallback(async () => {
    try {
      await validate();
      const privateOutCoinArr = privateOutCoins.map(
        (coinInfo) => new CipherBaseCoin(coinInfo as CipherCoinInfo)
      );

      const allCodes = privateOutCoinArr.map((coin) => {
        if (!coin.coinInfo.key.inSaltOrSeed) {
          throw new Error("Invalid coin info");
        }
        if (!coin.coinInfo.key.inRandom) {
          throw new Error("Invalid coin info");
        }
        return encodeCipherCode({
          tokenAddress: tokenAddress!,
          amount: coin.coinInfo.amount,
          salt: coin.coinInfo.key.inSaltOrSeed,
          random: coin.coinInfo.key.inRandom,
        });
      });

      for (let i = 0; i < allCodes.length; i++) {
        downloadCipher(allCodes[i]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  }, [privateOutCoins, toast, tokenAddress, validate]);

  const prepareProof = async () => {
    try {
      console.log({
        publicInAmt,
        publicOutAmt,
        privateInCoins,
        privateOutCoins,
        recipient,
        totalPrivateInAmt,
        totalPrivateOutAmt,
      });

      await validate();

      const { promise } = await syncAndGetCipherTree(tokenAddress!);
      const treeCache = await promise;

      const privateOutCoinArr = privateOutCoins.map(
        (coinInfo) => new CipherBaseCoin(coinInfo as CipherCoinInfo)
      );
      const publicInfo: PublicInfoStruct = {
        maxAllowableFeeRate: "0",
        recipient: address as string,
        // recipient: recipient || "",
        token: tokenAddress!,
        deadline: dayjs().add(1, "month").unix().toString(),
      };

      const result = await generateCipherTx(
        treeCache.cipherTree,
        {
          publicInAmt,
          publicOutAmt,
          privateInCoins: privateInCoins as CipherTransferableCoin[],
          privateOutCoins: privateOutCoinArr,
        },
        publicInfo
      );

      console.log({
        result,
      });

      setUtxoData(result.contractCalldata.utxoData);
      setPublicInfo(result.contractCalldata.publicInfo);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const sendTransaction = async () => {
    if (!utxoData || !publicInfo || !transactASync) {
      throw new Error("proof or publicInfo is undefined");
    }
    try {
      await transactASync?.();
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
    <CipherTxProviderContext.Provider
      value={{
        publicInAmt,
        setPublicInAmt,
        publicOutAmt,
        setPublicOutAmt,
        privateInCoins,
        setPrivateInCoins,
        privateOutCoins,
        setPrivateOutCoins,
        recipient,
        setRecipient,
        totalPrivateInAmt,
        totalPrivateOutAmt,
        downloadCipherCodes,
        prepareProof,
        sendTransaction,
      }}
    >
      {children}
    </CipherTxProviderContext.Provider>
  );
};
