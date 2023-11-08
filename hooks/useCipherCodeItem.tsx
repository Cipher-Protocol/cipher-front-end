import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CipherTransferableCoin } from "../lib/cipher/CipherCoin";
import { Observable } from "rx";
import { CipherTree } from "../lib/cipher/CipherTree";
import { useDebounce, useThrottle } from "@uidotdev/usehooks";
import { CipherTreeProviderContext } from "../providers/CipherTreeProvider";
import { assertCipherCode, decodeCipherCode, generateCommitment, toHashedSalt } from "../lib/cipher/CipherHelper";
import { TreeCacheItem, TreeSyncingQueueContext } from "../lib/cipher/types/CipherNewCommitment.type";
import { throttle } from "lodash";
import { CipherAccount } from "../type";
import { CipherAccountContext } from "../providers/CipherProvider";

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
  {
    cipherCode,
    tokenAddress,
    cipherAccount
  }: {
    cipherCode?: string,
    tokenAddress?: string;
    cipherAccount?: CipherAccount,
  }
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
    if(!tokenAddress) {
      return {
        transferableCoin: undefined,
        error: {
          message: 'Invalid token address',
          data: { tokenAddress },
        },
      }
    }
    if(!cipherAccount || (!cipherAccount.seed && !cipherAccount.userId)) {
      return {
        transferableCoin: undefined,
        error: {
          message: 'Invalid cipher account',
          data: { cipherAccount },
        },
      }
    }
    const cipherData = decodeCipherCode(cipherCode);
    assertCipherCode(cipherData, tokenAddress, BigInt(cipherAccount.userId || '0'));
    const saltOrSeed = cipherData.userId ? BigInt(cipherAccount.seed as string) : cipherData.salt as bigint;

    const commitment = generateCommitment({
      amount: cipherData.amount,
      salt: saltOrSeed,
      random: cipherData.random,
    });
    

    const {
      promise: treePromise,
    } = await syncAndGetCipherTree(cipherData.tokenAddress);
    const treeCache = await treePromise;

    const coinIndex = await getUnPaidIndexFromTree(treeCache.cipherTree, commitment, saltOrSeed);
    const transferableCoin = new CipherTransferableCoin({
      key: {
        inSaltOrSeed: saltOrSeed,
        inRandom: cipherData.random,
        hashedSaltOrUserId: toHashedSalt(saltOrSeed),
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

export const useCipherCodeItem = ({
  selectedTokenAddress,
  defaultCipherCode,
}: {
  selectedTokenAddress?: string;
  defaultCipherCode?: string
}): {
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
  const [cipherCode, setCipherCode] = useState<string>(defaultCipherCode || "");  
  const [transferableCoin, setTransferableCoin] = useState<CipherTransferableCoin | undefined>(undefined);
  const [error, setError] = useState<{
    message: string;
    data: Record<string, any>;
  } | undefined>(undefined);
  const { cipherAccount, } = useContext(CipherAccountContext);

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
      } = await parseCipherCode(syncAndGetCipherTree, getUnPaidIndexFromTree, {
        cipherCode,
        tokenAddress: selectedTokenAddress,
        cipherAccount,
      });
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