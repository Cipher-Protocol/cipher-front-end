import { createContext, use, useCallback, useMemo, useState } from "react";
import { CipherTree } from "../lib/cipher/CipherTree";
import { watchContractEvent, readContract, getWalletClient } from '@wagmi/core'
import CipherAbi from '../assets/Cipher-abi.json';
import { BigNumber, Contract, Wallet } from "ethers";
import { CIPHER_CONTRACT_ADDRESS } from "../configs/tokenConfig";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { PublicClient, getContract, parseAbiItem } from "viem";
import { assert, retry } from "../lib/helper";
import { DEFAULT_LEAF_ZERO_VALUE } from "../lib/cipher/CipherConfig";

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
  syncAndGetCipherTree: (cipherAddress: string) => void;
  getTreeDepth: (cipherAddress: string, token: string) => Promise<number>;
  getTreeNextLeafIndex: (cipherAddress: string, token: string) => Promise<number>;
  getIsNullified: (cipherAddress: string, token: string, nullifier: bigint) => Promise<boolean>;
  getSyncingTreeQueue: (tokenAddress: string) => TreeSyncingQueueItem | undefined;
  stopSyncingTreeQueue: (tokenAddress: string) => TreeSyncingQueueItem | undefined;
}>({
  tokenTreeMap: new Map<string, CipherTree>(),
  syncAndGetCipherTree: (cipherAddress: string) => {},
  getTreeDepth: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
  getTreeNextLeafIndex: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
  getIsNullified: async (cipherAddress: string, token: string, nullifier: bigint) => { throw new Error("not implemented"); },
  getSyncingTreeQueue: (tokenAddress: string) => undefined,
  stopSyncingTreeQueue: (tokenAddress: string) => undefined,
});
export const CipherTreeProvider = ({ children }: { children: React.ReactNode }) => {
  
  const publicClient = usePublicClient();
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
    console.log('syncAndGetCipherTree');
    const cipherStartBlockNumber = BigInt(process.env.REACT_APP_CIPHER_START_BLOCK_NUMBER || '0');
    const batchSize = BigInt(process.env.REACT_APP_CIPHER_SYNC_BATCH_SIZE || '1000');


    let currentStartBlock = cipherStartBlockNumber;
    let currentEndBlock = currentStartBlock + batchSize;
    const latestBlockNumber = await publicClient.getBlockNumber();
    currentEndBlock = currentEndBlock > latestBlockNumber ? latestBlockNumber : currentEndBlock;
  

    let result!: TreeCacheItem;
    if(TreeCache.has(tokenAddress)) {
      const tmp = TreeCache.get(tokenAddress)!;
      
      if(latestBlockNumber > result.endBlock) {
        currentStartBlock = result.endBlock + 1n;
        currentEndBlock = currentStartBlock + batchSize > latestBlockNumber ? latestBlockNumber : currentStartBlock + batchSize;
        result = {
          cipherTree: tmp.cipherTree,
          fromBlock: tmp.fromBlock,
          endBlock: latestBlockNumber,
          events: tmp.events,
          isSyncing: true,
        };
        console.log({
          message: 'syncTree use cache, but need to update',
          cache: tmp,
        })
      } else {
        // use cache
        console.log({
          message: 'syncTree use cache',
          cache: tmp,
        });
        return tmp;
      }

    } else {
      const depth = await getTreeDepth(CIPHER_CONTRACT_ADDRESS, tokenAddress);
      const cipherTree = new CipherTree({
        depth,
        zeroLeaf: DEFAULT_LEAF_ZERO_VALUE,
        tokenAddress,
      });
      result = {
        cipherTree,
        fromBlock: currentStartBlock,
        endBlock: latestBlockNumber,
        events: [],
        isSyncing: true,
      };
    }

    return addSyncingCipherTreeQueue(
      result,
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

  } else {
    const promise = syncNewCommitment(treeCacheItem, context);
    TreeSyncingQueue.set(tokenAddress, {
      promise,
      context,
    });
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
      const events = await retry<NewCommitmentLogsType>(async (tr) => {
        return await getCipherCommitmentLogs(context.publicClient, context.currentStartBlock, context.currentEndBlock);
      }, 5, 5000, async (error, retryTimes) => {
        console.error(`ERROR: getCipherCommitmentLogs RETRY, tokenAddress=${tokenAddress}, errorTimes=${retryTimes}`);
        console.error(error);
      });
      treeCacheItem.events = treeCacheItem.events.concat(events);

      context.currentStartBlock = context.currentEndBlock + 1n;
      context.currentEndBlock = context.currentEndBlock + context.batchSize > context.latestBlockNumber ? context.latestBlockNumber : context.currentEndBlock + context.batchSize;
      if (context.currentStartBlock > context.latestBlockNumber) {
          break;
      }
    } catch (error) {
      console.error(error);
      treeCacheItem.isSyncing = false;
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
  TreeCache.set(tokenAddress, treeCacheItem);

  return treeCacheItem;
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
