import { createContext, use, useCallback, useMemo, useState } from "react";
import { CipherTree } from "../lib/cipher/CipherTree";
import { watchContractEvent, readContract, getWalletClient } from '@wagmi/core'
import CipherAbi from '../assets/Cipher-abi.json';
import { BigNumber, Contract, Wallet } from "ethers";
import { CIPHER_CONTRACT_ADDRESS } from "../configs/tokenConfig";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { PublicClient, getContract, parseAbiItem } from "viem";
import type { Abi } from "viem";
import { assert, retry } from "../lib/helper";
import { DEFAULT_LEAF_ZERO_VALUE } from "../lib/cipher/CipherConfig";
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
type NewCommitmentLogsType = Awaited<ReturnType<typeof getCipherCommitmentLogs>>
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
    console.log({
      cipherAddress,
      token
    })
    const d = await readContract({
      address: cipherAddress as `0x${string}`,
      abi: CipherAbi.abi,
      functionName: 'getTreeDepth',
      args: [token],
    })
    console.log({
      cipherAddress,
      token,
      d,
    })
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

async function syncNewCommitment(treeCacheItem: TreeCacheItem, context: TreeSyncingQueueContext) {
  console.log({
    message: 'start syncNewCommitment',
    treeCacheItem,
    config: context,
  });
  const tokenAddress = treeCacheItem.cipherTree.tokenAddress;
  while (context.currentEndBlock <= context.latestBlockNumber) {
    try {
      if(context.isStop) {
        break;
      }
      console.log(`parsing ${context.currentStartBlock} ~ ${context.currentEndBlock} (EndBlockNumber=${context.latestBlockNumber}) ......`);
      const events = await retry<NewCommitmentLogsType>(async () => {
        const tmpLogs = await getCipherCommitmentLogs(context.publicClient, context.currentStartBlock, context.currentEndBlock);
        console.log({
          message: 'getCipherCommitmentLogs',
          tmpLogs,
        });
        return tmpLogs;
      }, 5, 5000, async (error, retryTimes) => {
        console.error(`ERROR: getCipherCommitmentLogs RETRY, tokenAddress=${tokenAddress}, errorTimes=${retryTimes}`);
        console.error(error);
      });
      treeCacheItem.events = treeCacheItem.events.concat(events);
      treeCacheItem.endBlock = context.currentEndBlock;

      context.currentStartBlock = context.currentEndBlock + 1n;
      context.currentEndBlock = context.currentEndBlock + context.batchSize > context.latestBlockNumber ? context.latestBlockNumber : context.currentEndBlock + context.batchSize;
      if (context.currentStartBlock > context.latestBlockNumber) {
          break;
      }
    } catch (error) {
      console.error(error);
      treeCacheItem.isSyncing = false;
      await updateCipherTreeFromEvents(treeCacheItem.cipherTree, treeCacheItem.events);
      TreeCache.set(tokenAddress, treeCacheItem);
      throw error;
    }
    await delay(Math.floor(Math.random() * 500 + 300)); // avoid rate limit, 300ms ~ 800ms
  }
  treeCacheItem.isSyncing = false;
  console.log({
    message: 'end syncNewCommitment',
    treeCacheItem,
    context,
  });
  await updateCipherTreeFromEvents(treeCacheItem.cipherTree, treeCacheItem.events);
  TreeCache.set(tokenAddress, treeCacheItem);

  return treeCacheItem;
}

async function updateCipherTreeFromEvents(cipherTree: CipherTree, events: NewCommitmentLogsType) {
  const sortedAscEvents = events.sort((a, b) => {
    const aLeafIndex = Number(a.args.leafIndex);
    const bLeafIndex = Number(b.args.leafIndex);
    assert(!isNaN(aLeafIndex), `aLeafIndex is NaN, a=${a}`);
    assert(!isNaN(bLeafIndex), `bLeafIndex is NaN, b=${b}`);
    return aLeafIndex - bLeafIndex;
  });

  // check all events leafIndex is continuous
  for (let actualIndex = 0; actualIndex < sortedAscEvents.length; actualIndex++) {
    const event = sortedAscEvents[actualIndex];
    const leafIndex = Number(event.args.leafIndex);
    assert(!isNaN(leafIndex), `leafIndex is NaN, event=${event}`);
    assert(actualIndex === leafIndex, `leafIndex is not continuous, leafIndex=${leafIndex}, index=${actualIndex}`);
  }

  const nextLeafIndex = cipherTree.nextIndex;
  // insert commitment to tree from nextLeafIndex
  for(let leafIndex = nextLeafIndex; leafIndex < sortedAscEvents.length; leafIndex++) {
    const event = sortedAscEvents[leafIndex];
    const commitment = event.args.commitment;
    assert(commitment !== undefined, `commitment is undefined`);
    cipherTree.insert(commitment);
  }
  return cipherTree;
}

async function getCipherCommitmentLogs(publicClient: PublicClient,fromBlock: bigint, toBlock: bigint) {
  const filter = await publicClient.createEventFilter({ 
    address: CIPHER_CONTRACT_ADDRESS,
    event: NewCommitmentAbiItem,
    fromBlock,
    toBlock,
  })
  
  const logs = await publicClient.getFilterLogs({
    filter,
  });
  return logs;
}

function delay(time: number) {
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve(true);
      }, time);
  });
}


// function getNewProvider(): any {
//   throw new Error("Function not implemented.");
// }
