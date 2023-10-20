import { createContext, use, useCallback, useMemo, useState } from "react";
import { CipherTree } from "../lib/cipher/CipherTree";
import { watchContractEvent, readContract, getWalletClient } from '@wagmi/core'
import CipherAbi from '../lib/cipher/CipherAbi.json';
import { BigNumber, Contract, Wallet } from "ethers";
import { CIPHER_CONTRACT_ADDRESS } from "../configs/tokenConfig";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { PublicClient, getContract, parseAbiItem } from "viem";
import type { Abi } from "viem";
import { assert, retry } from "../lib/helper";
import { DEFAULT_LEAF_ZERO_VALUE } from "../lib/cipher/CipherConfig";
import { fetchNewCommitmentsEvents } from "../lib/graphql";
import { syncNewCommitment } from "../lib/cipher/CipherSyncNewCommitments";
const NEXT_PUBLIC_CIPHER_START_BLOCK_NUMBER = BigInt(process.env.NEXT_PUBLIC_CIPHER_START_BLOCK_NUMBER || '0')
const NEXT_PUBLIC_CIPHER_SYNC_LOGS_BATCH_BLOCK_SIZE = BigInt(process.env.NEXT_PUBLIC_CIPHER_SYNC_LOGS_BATCH_BLOCK_SIZE || '1000');
console.log({
  NEXT_PUBLIC_CIPHER_START_BLOCK_NUMBER,
  NEXT_PUBLIC_CIPHER_SYNC_LOGS_BATCH_BLOCK_SIZE,
})
// const NewCommitmentAbi = CipherAbi.abi.find((abi) => abi.name === 'NewCommitment' && abi.type === 'event');
// assert(NewCommitmentAbi, `NewCommitmentAbi is undefined`);
// const NewCommitmentAbiType = NewCommitmentAbi.inputs.map((input) => `${input.type} ${input.name}`).join(',');
const NewCommitmentAbiItem = parseAbiItem('event NewCommitment(address indexed token, uint256 newRoot, uint256 commitment, uint256 leafIndex)');
interface NewCommitmentLogType {
  blockNumber: string,
  leafIndex: string,
  commitment: string,
  newRoot?: string,
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
const TreeCache = new Map<string, TreeCacheItem>(); // tokenAddress => CipherTree
interface TreeSyncingQueueContext {
  publicClient: PublicClient,
  currentStartBlock: bigint,
  currentEndBlock: bigint,
  batchSize: bigint,
  latestBlockNumber: bigint,
  isStop: boolean,
}
interface TreeSyncingQueueItem {
  promise: Promise<TreeCacheItem>,
  context: TreeSyncingQueueContext,
}
const TreeSyncingQueue = new Map<string, TreeSyncingQueueItem>();

export const CipherTreeProviderContext = createContext<{
  tokenTreeMap: Map<string, CipherTree>;
  syncAndGetCipherTree: (tokenAddress: string) => Promise<{
    promise: Promise<TreeCacheItem>;
    context: TreeSyncingQueueContext;
  }>;
  getTreeDepth: (cipherAddress: string, token: string) => Promise<number>;
  getTreeNextLeafIndex: (cipherAddress: string, token: string) => Promise<number>;
  getIsNullified: (cipherAddress: string, token: string, nullifier: bigint) => Promise<boolean>;
  getSyncingTreeQueue: (tokenAddress: string) => TreeSyncingQueueItem | undefined;
  stopSyncingTreeQueue: (tokenAddress: string) => TreeSyncingQueueItem | undefined;
  getContractTreeRoot: (cipherAddress: string, token: string) => Promise<bigint>;
}>({
  tokenTreeMap: new Map<string, CipherTree>(),
  syncAndGetCipherTree: (tokenAddress: string) => {
    throw new Error("not implemented");
  },
  getTreeDepth: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
  getTreeNextLeafIndex: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
  getIsNullified: async (cipherAddress: string, token: string, nullifier: bigint) => { throw new Error("not implemented"); },
  getSyncingTreeQueue: (tokenAddress: string) => undefined,
  stopSyncingTreeQueue: (tokenAddress: string) => undefined,
  getContractTreeRoot: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
});
export const CipherTreeProvider = ({ children }: { children: React.ReactNode }) => {
  
  const publicClient = usePublicClient();
  const getContractTreeRoot = async (cipherAddress: string, token: string) => {
    const d = await readContract({
      address: cipherAddress as `0x${string}`,
      abi: CipherAbi.abi,
      functionName: 'getTreeRoot',
      args: [token],
    });
    return d as bigint;
  }
  const getIsNullified = async (cipherAddress: string, token: string, nullifier: bigint) => {
    const d = await readContract({
      address: cipherAddress as `0x${string}`,
      abi: CipherAbi.abi,
      functionName: 'isNullified',
      args: [token, BigNumber.from(nullifier)],
    });
    return Boolean(d);
  }
  const getTreeNextLeafIndex = async (cipherAddress: string, token: string) => {
    const d = await readContract({
      address: cipherAddress as `0x${string}`,
      abi: CipherAbi.abi,
      functionName: 'getTreeLeafNum',
      args: [token],
    })
    const leafIndex = Number(d);
    if(isNaN(leafIndex)) {
      throw new Error("leafIndex is NaN");
    }
    return leafIndex;
  }
  const getTreeDepth = async (cipherAddress: string, token: string) => {
    const d = await readContract({
      address: cipherAddress as `0x${string}`,
      abi: CipherAbi.abi,
      functionName: 'getTreeDepth',
      args: [token],
    });
    const numDepth = Number(d);
    if(isNaN(numDepth)) {
      throw new Error("depth is NaN");
    }
    return numDepth;
  }

  const getSyncingTreeQueue = useCallback((tokenAddress: string) => {
    return TreeSyncingQueue.get(tokenAddress);
  }, []);

  const stopSyncingTreeQueue = useCallback((tokenAddress: string) => {
    const queue = getSyncingTreeQueue(tokenAddress);
    if(queue) {
      queue.context.isStop = true;
      return queue;
    }
    return undefined;
  }, [getSyncingTreeQueue]);

  const syncAndGetCipherTree = useCallback(async (tokenAddress: string,) => {
    const cipherStartBlockNumber = NEXT_PUBLIC_CIPHER_START_BLOCK_NUMBER;
    const batchSize = NEXT_PUBLIC_CIPHER_SYNC_LOGS_BATCH_BLOCK_SIZE;
    console.log({
      message: 'syncAndGetCipherTree',
      tokenAddress,
      cipherStartBlockNumber,
      batchSize,
    });

    let currentStartBlock = cipherStartBlockNumber;
    let currentEndBlock = currentStartBlock + batchSize;
    const latestBlockNumber = await publicClient.getBlockNumber();
    currentEndBlock = currentEndBlock > latestBlockNumber ? latestBlockNumber : currentEndBlock;
  

    let newCache!: TreeCacheItem;
    if(TreeSyncingQueue.has(tokenAddress)) {
      const {
        promise,
        context
      } = TreeSyncingQueue.get(tokenAddress)!;
      const oldCache = await promise;
      
      if(latestBlockNumber > oldCache.endBlock) {
        currentStartBlock = oldCache.endBlock + 1n;
        currentEndBlock = currentStartBlock + batchSize > latestBlockNumber ? latestBlockNumber : currentStartBlock + batchSize;
        newCache = {
          cipherTree: oldCache.cipherTree,
          fromBlock: oldCache.fromBlock,
          endBlock: 0n,
          events: oldCache.events,
          isSyncing: true,
        };
        console.log({
          message: 'syncTree use cache, but need to update',
          oldCache,
        })
      } else {
        return {
          promise,
          context,
        }
      }
    } else {
      const depth = await getTreeDepth(CIPHER_CONTRACT_ADDRESS, tokenAddress);
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

    return addSyncingCipherTreeQueue(
      newCache,
      {
        publicClient,
        currentStartBlock,
        currentEndBlock,
        batchSize,
        latestBlockNumber,
        isStop: false,
      }
    );
  }, [publicClient]);

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
      }}
    >
      {children}
    </CipherTreeProviderContext.Provider>
  )
};

function addSyncingCipherTreeQueue(
  treeCacheItem: TreeCacheItem,
  context: TreeSyncingQueueContext
) {
  const tokenAddress = treeCacheItem.cipherTree.tokenAddress;
  if(TreeSyncingQueue.has(tokenAddress)) {
    const currentQueue = TreeSyncingQueue.get(tokenAddress)!;
    const promise = new Promise<TreeCacheItem>(async (resolve, reject) => {
      try {
        currentQueue.context.isStop = true;
        const newTreeCache = await currentQueue.promise;
        const newTreeCacheItem = await syncNewCommitment(treeCacheItem, {
          ...context,
          currentStartBlock: newTreeCache.endBlock + 1n,
        });
        resolve(newTreeCacheItem);
      } catch (error) {
        reject(error);
      }
    });
    TreeSyncingQueue.set(tokenAddress, {
      promise,
      context,
    });
    return {
      promise,
      context,
    }
  } else {
    const promise = syncNewCommitment(treeCacheItem, context);
    TreeSyncingQueue.set(tokenAddress, {
      promise,
      context,
    });
    return {
      promise,
      context,
    }
  }
}
