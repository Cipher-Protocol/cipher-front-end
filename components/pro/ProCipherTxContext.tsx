import { Dispatch, SetStateAction, createContext, useCallback, useContext, useMemo, useState } from "react";
import { CipherBaseCoin, CipherCoinInfo, CipherTransferableCoin } from "../../lib/cipher/CipherCoin";
import { useToast } from "@chakra-ui/react";
import { CipherTreeProviderContext } from "../../providers/CipherTreeProvider";
import { generateCipherTx } from "../../lib/cipher/CipherCore";
import { PublicInfoStruct } from "../../lib/cipher/types/CipherContract.type";
import dayjs from "dayjs";


export const CipherTxProviderContext = createContext<{
  publicInAmt: bigint;
  setPublicInAmt: Dispatch<SetStateAction<bigint>>;
  publicOutAmt: bigint;
  setPublicOutAmt: Dispatch<SetStateAction<bigint>>;
  privateInCoins: Array<CipherTransferableCoin | null>;
  setPrivateInCoins: (coins: Array<CipherTransferableCoin | null>) => void;
  privateOutCoinInfos: Array<CipherCoinInfo | null>;
  setPrivateOutCoins: (coins: Array<CipherCoinInfo | null>) => void;
  recipient: string | null;
  setRecipient: (recipient: string | null) => void;
  totalPrivateInAmt: bigint;
  totalPrivateOutAmt: bigint;
  sendTransaction: () => Promise<void>;
}>({
  publicInAmt: BigInt(0),
  setPublicInAmt: () => {},
  publicOutAmt: BigInt(0),
  setPublicOutAmt: () => {},
  privateInCoins: [],
  setPrivateInCoins: () => {},
  privateOutCoinInfos: [],
  setPrivateOutCoins: () => {},
  recipient: "",
  setRecipient: () => {},
  totalPrivateInAmt: BigInt(0),
  totalPrivateOutAmt: BigInt(0),
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

  const {
    syncAndGetCipherTree,
    getUnPaidIndexFromTree,
  } = useContext(CipherTreeProviderContext);

  const [publicInAmt, setPublicInAmt] = useState(BigInt(0));
  const [publicOutAmt, setPublicOutAmt] = useState(BigInt(0));
  const [privateInCoins, setPrivateInCoins] = useState<Array<CipherTransferableCoin | null>>([]);
  const [privateOutCoinInfos, setPrivateOutCoins] = useState<Array<CipherCoinInfo | null>>([]);
  const [recipient, setRecipient] = useState<string | null>("");

  const isPrivateInCoinsValid = useMemo(() => {
    return privateInCoins.every((coin) => coin !== null);
  }, [privateInCoins]);

  const isPrivateOutCoinsValid = useMemo(() => {
    return privateOutCoinInfos.every((coin) => coin !== null);
  }, [privateOutCoinInfos]);

  const totalPrivateInAmt = useMemo(() => {
    return privateInCoins.reduce((acc, coin) => {
      if (coin === null) return acc;
      return acc + coin.coinInfo.amount;
    }, BigInt(0));
  }, [privateInCoins]);

  const totalPrivateOutAmt = useMemo(() => {
    return privateOutCoinInfos.reduce((acc, coin) => {
      if (coin === null) return acc;
      return acc + coin.amount;
    }, BigInt(0));
  }, [privateOutCoinInfos]);

  const sendTransaction = async () => {

    try {
      console.log({
        publicInAmt,
        publicOutAmt,
        privateInCoins,
        privateOutCoins: privateOutCoinInfos,
        recipient,
        totalPrivateInAmt,
        totalPrivateOutAmt,
      });

      if(!tokenAddress)  {
        throw new Error("Token address is not set");
      }

      if(privateInCoins.length === 0 && privateOutCoinInfos.length === 0) {
        throw new Error("No input and output coins");
      }

      if(!isPrivateInCoinsValid) {
        throw new Error("Invalid private input coins");
      }

      if(!isPrivateOutCoinsValid) {
        throw new Error("Invalid private output coins");
      }

      if(publicInAmt + totalPrivateInAmt !== publicOutAmt + totalPrivateOutAmt) {
        throw new Error("total IN amount and total OUT amount not match");
      }

      if(publicOutAmt > 0 && !recipient) {
        throw new Error("recipient must be set if public OUT amount is greater than 0");
      }

      const { promise } = await syncAndGetCipherTree(tokenAddress);
      const treeCache = await promise;

      const privateOutCoins = privateOutCoinInfos.map((coinInfo) => new CipherBaseCoin(coinInfo as CipherCoinInfo));
      const publicInfo: PublicInfoStruct = {
        maxAllowableFeeRate: "0",
        recipient: recipient || "",
        token: tokenAddress,
        deadline: dayjs().add(1, "month").unix().toString(),
      }

      const result = generateCipherTx(
        treeCache.cipherTree,
        {
          publicInAmt,
          publicOutAmt,
          privateInCoins: privateInCoins as CipherTransferableCoin[],
          privateOutCoins,
        },
        publicInfo,
      )

      console.log({
        result,
      })

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


  return (
    <CipherTxProviderContext.Provider
      value={{
        publicInAmt,
        setPublicInAmt,
        publicOutAmt,
        setPublicOutAmt,
        privateInCoins,
        setPrivateInCoins,
        privateOutCoinInfos: privateOutCoinInfos,
        setPrivateOutCoins,
        recipient,
        setRecipient,
        totalPrivateInAmt,
        totalPrivateOutAmt,
        sendTransaction,
      }}
    >
      {children}
    </CipherTxProviderContext.Provider>
  );

};