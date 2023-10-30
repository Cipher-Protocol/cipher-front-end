import { createContext, use, useCallback, useMemo, useState } from "react";
import { CipherTree } from "../lib/cipher/CipherTree";
import { watchContractEvent, readContract, getWalletClient } from "@wagmi/core";
import CipherAbi from "../lib/cipher/CipherAbi.json";
import { BigNumber, Contract, Wallet } from "ethers";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { PublicClient, getContract, parseAbiItem } from "viem";
import type { Abi } from "viem";
import { assert, retry } from "../lib/helper";
import { DEFAULT_LEAF_ZERO_VALUE } from "../lib/cipher/CipherConfig";
import { getChainConfig } from "../configs/chainConfig";
import { CipherTreeDataCollector } from "../lib/cipher/CipherSyncNewCommitments";
import { useThrottle } from "@uidotdev/usehooks";
import {
  generateNullifier,
  indicesToPathIndices,
} from "../lib/cipher/CipherHelper";
import { throttle } from "lodash";
import { cachedThrottle } from "../utils/helper";
// import { cachedThrottle } from "../utils/helper";

interface NewCommitmentLogType {
  blockNumber: string;
  leafIndex: string;
  commitment: string;
  newRoot?: string;
}
type NewCommitmentLogsType = NewCommitmentLogType[];
// type NewCommitmentLogsType = Awaited<ReturnType<typeof getCipherCommitmentLogs>>
interface TreeCacheItem {
  cipherTree: CipherTree;
  fromBlock: bigint;
  endBlock: bigint;
  events: NewCommitmentLogsType;
  isSyncing: boolean;
}
interface TreeSyncingQueueContext {
  publicClient: PublicClient;
  currentStartBlock: bigint;
  currentEndBlock: bigint;
  batchSize: bigint;
  latestBlockNumber: bigint;
  isStop: boolean;
}
interface TreeSyncingQueueItem {
  key: string;
  promise: Promise<TreeCacheItem>;
  context: TreeSyncingQueueContext;
  stopSyncing: () => Promise<TreeCacheItem>;
}

type TreeSyncingQueueKey = `${number}-${string}-${string}`;
type CipherTreeDataCollectorKey = `${number}-${string}`;
const TreeSyncingQueue = new Map<TreeSyncingQueueKey, TreeSyncingQueueItem>(); // chainId-cipherContractAddress-tokenAddress -> TreeSyncingQueueItem
const CipherTreeDataCollectorCache = new Map<
  CipherTreeDataCollectorKey,
  CipherTreeDataCollector
>(); // chainId-cipherContractAddress -> CipherTreeDataCollector

export const CipherTreeProviderContext = createContext<{
  tokenTreeMap: Map<string, CipherTree>;
  syncAndGetCipherTree: (tokenAddress: string) => Promise<{
    promise: Promise<TreeCacheItem>;
    context: TreeSyncingQueueContext;
  }>;
  getTreeDepth: (token: string) => Promise<number>;
  getTreeNextLeafIndex: (token: string) => Promise<number>;
  getIsNullified: (token: string, nullifier: bigint) => Promise<boolean>;
  getSyncingTreeQueue: (
    tokenAddress: string
  ) => TreeSyncingQueueItem | undefined;
  stopSyncingTreeQueue: (
    tokenAddress: string
  ) => TreeSyncingQueueItem | undefined;
  getContractTreeRoot: (token: string) => Promise<bigint>;
  getUnPaidIndexFromTree: (
    tree: CipherTree,
    commitment: bigint,
    salt: bigint
  ) => Promise<number>;
}>({
  tokenTreeMap: new Map<string, CipherTree>(),
  syncAndGetCipherTree: (tokenAddress: string) => {
    throw new Error("not implemented");
  },
  getTreeDepth: async (token: string) => {
    throw new Error("not implemented");
  },
  getTreeNextLeafIndex: async (token: string) => {
    throw new Error("not implemented");
  },
  getIsNullified: async (token: string, nullifier: bigint) => {
    throw new Error("not implemented");
  },
  getSyncingTreeQueue: (tokenAddress: string) => undefined,
  stopSyncingTreeQueue: (tokenAddress: string) => undefined,
  getContractTreeRoot: async (token: string) => {
    throw new Error("not implemented");
  },
  getUnPaidIndexFromTree: async (
    tree: CipherTree,
    commitment: bigint,
    salt: bigint
  ) => {
    throw new Error("not implemented");
  },
});
export const CipherTreeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const publicClient = usePublicClient();

  const getLatestBlockNumber = useMemo(() => {
    const func = async () => {
      const blockNumber = await publicClient.getBlockNumber();
      return blockNumber;
    };
    const t = new cachedThrottle(func, 1000, {
      leading: true,
      trailing: false,
    });
    return t;
  }, [publicClient]);

  const cipherContractInfo = useMemo(() => {
    return getChainConfig(publicClient.chain.id);
  }, [publicClient]);

  const cipherTreeDataCollector = useMemo(() => {
    if (!cipherContractInfo) {
      return undefined;
    }
    if (!cipherContractInfo?.cipherContractAddress) {
      return undefined;
    }
    if (!publicClient?.chain?.id) {
      return undefined;
    }
    const cipherContractAddress =
      cipherContractInfo?.cipherContractAddress as string;
    const key = getCipherTreeDataCollectorKey(
      publicClient.chain.id,
      cipherContractAddress
    );
    if (CipherTreeDataCollectorCache.has(key)) {
      return CipherTreeDataCollectorCache.get(key)!;
    } else {
      const collector = new CipherTreeDataCollector(cipherContractInfo);
      CipherTreeDataCollectorCache.set(key, collector);
      return collector;
    }
  }, [cipherContractInfo, publicClient]);

  const getContractTreeRoot = useCallback(
    async (token: string) => {
      const d = await readContract({
        address: cipherContractInfo?.cipherContractAddress as `0x${string}`,
        abi: CipherAbi.abi,
        functionName: "getTreeRoot",
        args: [token],
      });
      return d as bigint;
    },
    [cipherContractInfo]
  );

  const getIsNullified = useCallback(
    async (token: string, nullifier: bigint) => {
      const d = await readContract({
        address: cipherContractInfo?.cipherContractAddress as `0x${string}`,
        abi: CipherAbi.abi,
        functionName: "isNullified",
        args: [token, BigNumber.from(nullifier)],
      });
      return Boolean(d);
    },
    [cipherContractInfo]
  );

  const getTreeNextLeafIndex = useCallback(
    async (token: string) => {
      const d = await readContract({
        address: cipherContractInfo?.cipherContractAddress as `0x${string}`,
        abi: CipherAbi.abi,
        functionName: "getTreeLeafNum",
        args: [token],
      });
      const leafIndex = Number(d);
      if (isNaN(leafIndex)) {
        throw new Error("leafIndex is NaN");
      }
      return leafIndex;
    },
    [cipherContractInfo]
  );
  const getTreeDepth = useCallback(
    async (token: string) => {
      const d = await readContract({
        address: cipherContractInfo?.cipherContractAddress as `0x${string}`,
        abi: CipherAbi.abi,
        functionName: "getTreeDepth",
        args: [token],
      });
      const numDepth = Number(d);
      if (isNaN(numDepth)) {
        throw new Error("depth is NaN");
      }
      return numDepth;
    },
    [cipherContractInfo]
  );

  const getSyncingTreeQueue = useCallback((tokenAddress: string) => {
    if (!cipherTreeDataCollector) return undefined;
    const key = getTreeSyncingQueueKey(cipherTreeDataCollector, tokenAddress);
    return TreeSyncingQueue.get(key);
  }, []);

  const stopSyncingTreeQueue = useCallback(
    (tokenAddress: string) => {
      const queue = getSyncingTreeQueue(tokenAddress);
      if (queue) {
        queue.stopSyncing();
        return queue;
      }
      return undefined;
    },
    [getSyncingTreeQueue]
  );

  const syncAndGetCipherTree = useCallback(
    async (tokenAddress: string) => {
      if (!cipherContractInfo || !cipherTreeDataCollector) {
        throw new Error("unsupported chain!");
      }
      const key = getTreeSyncingQueueKey(cipherTreeDataCollector, tokenAddress);
      console.log({
        message: "syncAndGetCipherTree",
        tokenAddress,
        cipherTreeDataCollectorConfig: cipherTreeDataCollector.config,
      });

      const batchSize = BigInt(
        cipherTreeDataCollector.config.syncBlockBatchSize
      );
      let currentStartBlock = cipherTreeDataCollector.config.startBlock;
      let currentEndBlock = currentStartBlock + batchSize;
      const latestBlockNumber = await getLatestBlockNumber.execute();
      currentEndBlock =
        currentEndBlock > latestBlockNumber
          ? latestBlockNumber
          : currentEndBlock;

      let newCache!: TreeCacheItem;
      if (TreeSyncingQueue.has(key)) {
        const { promise, context } = TreeSyncingQueue.get(key)!;
        const oldCache = await promise;

        if (latestBlockNumber > oldCache.endBlock) {
          currentStartBlock = oldCache.endBlock + 1n;
          currentEndBlock =
            currentStartBlock + batchSize > latestBlockNumber
              ? latestBlockNumber
              : currentStartBlock + batchSize;
          newCache = {
            cipherTree: oldCache.cipherTree,
            fromBlock: oldCache.fromBlock,
            endBlock: 0n,
            events: oldCache.events,
            isSyncing: true,
          };
          console.log({
            message: "syncTree use cache, but need to update",
            oldCache,
          });
        } else {
          return {
            promise,
            context,
          };
        }
      } else {
        const depth = await getTreeDepth(tokenAddress);
        const cipherTree = new CipherTree({
          depth,
          zeroLeaf: DEFAULT_LEAF_ZERO_VALUE,
          tokenAddress,
        });
        newCache = {
          cipherTree,
          fromBlock: currentStartBlock,
          endBlock: 0n,
          events: [],
          isSyncing: true,
        };
      }

      return addSyncingCipherTreeQueue(cipherTreeDataCollector, newCache, {
        publicClient,
        currentStartBlock,
        currentEndBlock,
        batchSize,
        latestBlockNumber,
        isStop: false,
      });
    },
    [cipherContractInfo, cipherTreeDataCollector, getTreeDepth, publicClient]
  );

  const getUnPaidIndexFromTree = useCallback(
    async (tree: CipherTree, commitment: bigint, salt: bigint) => {
      let coinLeafIndex = -1;
      const coinLeafIndexes = tree.findLeafIndexsByCommitment(commitment);
      if (coinLeafIndexes.length === 0) {
        throw new Error("Commitment is not found");
      }
      for (let index = 0; index < coinLeafIndexes.length; index++) {
        const leafIndex = coinLeafIndexes[index];
        console.log(`check paid: leafIndex=${leafIndex}`);
        const mkp = tree.genMerklePath(leafIndex);
        const indices = indicesToPathIndices(mkp.indices);
        const nullifier = generateNullifier(commitment, indices, salt);
        const isPaid = await getIsNullified(tree.tokenAddress, nullifier);
        if (!isPaid) {
          coinLeafIndex = leafIndex;
          return coinLeafIndex;
        }
      }
      throw new Error("Commitment is used");
    },
    [getIsNullified]
  );

  return (
    <CipherTreeProviderContext.Provider
      value={{
        tokenTreeMap: new Map<string, CipherTree>(),
        syncAndGetCipherTree,
        getTreeDepth,
        getTreeNextLeafIndex,
        getIsNullified,
        getSyncingTreeQueue,
        stopSyncingTreeQueue,
        getContractTreeRoot,
        getUnPaidIndexFromTree,
      }}
    >
      {children}
    </CipherTreeProviderContext.Provider>
  );
};

function addSyncingCipherTreeQueue(
  cipherTreeDataCollector: CipherTreeDataCollector,
  treeCacheItem: TreeCacheItem,
  context: TreeSyncingQueueContext
) {
  const tokenAddress = treeCacheItem.cipherTree.tokenAddress;
  const key = getTreeSyncingQueueKey(cipherTreeDataCollector, tokenAddress);
  if (TreeSyncingQueue.has(key)) {
    const currentQueue = TreeSyncingQueue.get(key)!;
    const promise = new Promise<TreeCacheItem>(async (resolve, reject) => {
      try {
        currentQueue.stopSyncing();
        const newTreeCache = await currentQueue.promise;
        const newTreeCacheItem =
          await cipherTreeDataCollector.syncNewCommitment(treeCacheItem, {
            ...context,
            currentStartBlock: newTreeCache.endBlock + 1n,
          });
        resolve(newTreeCacheItem);
      } catch (error) {
        reject(error);
      }
    });
    const stopSyncing = async () => {
      return await currentQueue.stopSyncing();
    };
    TreeSyncingQueue.set(key, {
      key,
      promise,
      context,
      stopSyncing,
    });
    return {
      promise,
      context,
      stopSyncing,
    };
  } else {
    const promise = cipherTreeDataCollector.syncNewCommitment(
      treeCacheItem,
      context
    );
    const stopSyncing = async () => {
      context.isStop = true;
      return await promise;
    };
    TreeSyncingQueue.set(key, {
      key,
      promise,
      context,
      stopSyncing,
    });
    return {
      promise,
      context,
      stopSyncing,
    };
  }
}

function getTreeSyncingQueueKey(
  cipherTreeDataCollector: CipherTreeDataCollector,
  tokenAddress: string
): TreeSyncingQueueKey {
  return `${cipherTreeDataCollector.config.chainId}-${cipherTreeDataCollector.config.cipherContractAddress}-${tokenAddress}`;
}

function getCipherTreeDataCollectorKey(
  chainId: number,
  cipherContractAddress: string
): CipherTreeDataCollectorKey {
  return `${chainId}-${cipherContractAddress}`;
}
