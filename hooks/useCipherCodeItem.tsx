import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CipherTransferableCoin } from "../lib/cipher/CipherCoin";
import { Observable } from "rx";
import { CipherTree } from "../lib/cipher/CipherTree";
import { useDebounce, useThrottle } from "@uidotdev/usehooks";
import { CipherTreeProviderContext } from "../providers/CipherTreeProvider";
import { decodeCipherCode, generateCommitment, toHashedSalt } from "../lib/cipher/CipherHelper";
import { TreeCacheItem, TreeSyncingQueueContext } from "../lib/cipher/types/CipherNewCommitment.type";
import { throttle } from "lodash";

const parseCipherCode = async (
  syncAndGetCipherTree: (tokenAddress: string) => Promise<{
    promise: Promise<TreeCacheItem>;
    context: TreeSyncingQueueContext;
  }>,
  getUnPaidIndexFromTree: (
    tree: CipherTree,
    commitment: bigint,
    salt: bigint
  ) => Promise<number>,
  cipherCode?: string,
): Promise<{
  transferableCoin?: CipherTransferableCoin;
  error?: {
    message: string;
    data: Record<string, any>;
  };
}> => {
  try {
    if (!cipherCode) return {
      transferableCoin: undefined,
      error: {
        message: 'Invalid cipher code',
        data: { cipherCode },
      },
    };
    const cipherData = decodeCipherCode(cipherCode);
    const commitment = generateCommitment({
      amount: cipherData.amount,
      salt: cipherData.salt,
      random: cipherData.random,
    });

    const {
      promise: treePromise,
    } = await syncAndGetCipherTree(cipherData.tokenAddress);
    const treeCache = await treePromise;

    const coinIndex = await getUnPaidIndexFromTree(treeCache.cipherTree, commitment, cipherData.salt);
    const transferableCoin = new CipherTransferableCoin({
      key: {
        inSaltOrSeed: cipherData.salt,
        inRandom: cipherData.random,
        hashedSaltOrUserId: toHashedSalt(cipherData.salt),
      },
      amount: cipherData.amount,
    }, treeCache.cipherTree, coinIndex); 
    return {
      transferableCoin,
      error: undefined,
    }
  } catch (error: any) {
    console.error(error);
    return {
      transferableCoin: undefined,
      error: {
        message: error.message,
        data: error.data,
      },
    }
  }
}

export const useCipherCodeItem = (): {
  isLoading: boolean;
  cipherCode?: string;
  transferableCoin?: CipherTransferableCoin;
  setCipherCode: (code: string) => void;
  checkValid: () => Promise<{
    transferableCoin?: CipherTransferableCoin;
    error?: {
      message: string;
      data: Record<string, any>;
    };
  }>;
  error?: {
    message: string;
    data: Record<string, any>;
  };
} => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cipherCode, setCipherCode] = useState<string>('');  
  const [transferableCoin, setTransferableCoin] = useState<CipherTransferableCoin | undefined>(undefined);
  const [error, setError] = useState<{
    message: string;
    data: Record<string, any>;
  } | undefined>(undefined);
  // const debouncedCipherCode = useDebounce(cipherCode, 1000);

  const {
    syncAndGetCipherTree,
    getUnPaidIndexFromTree,
  } = useContext(CipherTreeProviderContext);

  const resetResult = () => {
    setError(undefined);
    setTransferableCoin(undefined);
  }


  const checkValid = useCallback(async (): Promise<{
    transferableCoin?: CipherTransferableCoin;
    error?: {
      message: string;
      data: Record<string, any>;
    };
  }> => {
    try {
      setIsLoading(true);
      const {
        transferableCoin,
        error,
      } = await parseCipherCode(syncAndGetCipherTree, getUnPaidIndexFromTree, cipherCode);
      setTransferableCoin(transferableCoin);
      setError(error);
      setIsLoading(false);
      return {
        transferableCoin,
        error,
      }
    } catch (error: any) {
      const errInfo = {
        message: error.message,
        data: error.data,
      };
      setIsLoading(false);
      return {
        transferableCoin: undefined,
        error: errInfo,
      }
    }
  }, [cipherCode, getUnPaidIndexFromTree, syncAndGetCipherTree]);

  return {
    isLoading,
    cipherCode,
    setCipherCode,
    transferableCoin,
    error,
    checkValid,
  }
}