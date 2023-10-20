import { PublicClient, parseAbiItem } from "viem";
import { NewCommitmentLogType, NewCommitmentLogsType, TreeCacheItem, TreeSyncingQueueContext, TreeSyncingQueueItem } from "./types/CipherNewCommitment.type";
import { fetchNewCommitmentsEvents } from "../graphql";
import { assert, retry } from "../helper";
import { CIPHER_CONTRACT_ADDRESS } from "../../configs/tokenConfig";
import { CipherTree } from "./CipherTree";
import { delay } from "./CipherHelper";

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
const TreeCache = new Map<string, TreeCacheItem>(); // tokenAddress => CipherTree
const TreeSyncingQueue = new Map<string, TreeSyncingQueueItem>();

export async function syncNewCommitment(treeCacheItem: TreeCacheItem, context: TreeSyncingQueueContext) {
  return new Promise<TreeCacheItem>(async (resolve, reject) => {
    try {
      const result = await syncNewCommitmentFromSubgraph(treeCacheItem, context);
      return resolve(result);
    } catch (subGraphError) {
      console.error('syncNewCommitmentFromSubgraph error, try syncNewCommitmentFromRpc');
    }

    try {
      const result = await syncNewCommitmentFromRpc(treeCacheItem, context);
      return resolve(result);
    } catch (error) {
      console.error('syncNewCommitmentFromRpc error, stop');
      reject(error);
    }
  });
}

export async function syncNewCommitmentFromSubgraph(treeCacheItem: TreeCacheItem, context: TreeSyncingQueueContext) {
  try {
    console.log({
      message: 'start syncNewCommitmentFromSubgraph',
      treeCacheItem,
      config: context,
    });
    const tokenAddress = treeCacheItem.cipherTree.tokenAddress;
    const { data } = await fetchNewCommitmentsEvents({
      tokenAddress,
      startBlock: Number(context.currentStartBlock),
    });
    console.log({
      message: 'fetchNewCommitmentsEvents success',
      tokenAddress,
      startBlock: Number(context.currentStartBlock),
      tmp: data,
    });
    treeCacheItem.events = [ ...data.newCommitments ]; // TODO: handle tricky case: data.newCommitments is readonly array
    const last = data.newCommitments.length > 0 ? data.newCommitments[data.newCommitments.length - 1] :  null;
    if(last) {
      treeCacheItem.endBlock = BigInt(last.blockNumber);
    }
    treeCacheItem.isSyncing = false;
    console.log({
      message: 'end syncNewCommitmentFromSubgraph',
      treeCacheItem,
      context,
    });
    await updateCipherTreeFromEvents(treeCacheItem.cipherTree, treeCacheItem.events);
    TreeCache.set(tokenAddress, treeCacheItem);
  } catch (error) {
    console.error(error);
  }
  return treeCacheItem;
}

export async function syncNewCommitmentFromRpc(treeCacheItem: TreeCacheItem, context: TreeSyncingQueueContext) {
  console.log({
    message: 'start syncNewCommitmentFromRpc',
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
      const rawEvents = await retry(async () => {
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
      treeCacheItem.events = treeCacheItem.events.concat(rawEvents.map((rawEvent) => {
        const r: NewCommitmentLogType = {
          blockNumber: rawEvent.blockNumber.toString(),
          leafIndex: rawEvent.args.leafIndex?.toString() || '',
          commitment: rawEvent.args.commitment?.toString() || '',
          newRoot: rawEvent.args.newRoot?.toString(),
        }
        return r;
      }));      treeCacheItem.endBlock = context.currentEndBlock;

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
    message: 'end syncNewCommitmentFromRpc',
    treeCacheItem,
    context,
  });
  await updateCipherTreeFromEvents(treeCacheItem.cipherTree, treeCacheItem.events);
  TreeCache.set(tokenAddress, treeCacheItem);

  return treeCacheItem;
}

export async function updateCipherTreeFromEvents(cipherTree: CipherTree, events: NewCommitmentLogsType) {
  const sortedAscEvents = events.sort((a, b) => {
    const aLeafIndex = Number(a.leafIndex);
    const bLeafIndex = Number(b.leafIndex);
    assert(!isNaN(aLeafIndex), `aLeafIndex is NaN, a=${a}`);
    assert(!isNaN(bLeafIndex), `bLeafIndex is NaN, b=${b}`);
    return aLeafIndex - bLeafIndex;
  });

  // check all events leafIndex is continuous
  for (let actualIndex = 0; actualIndex < sortedAscEvents.length; actualIndex++) {
    const event = sortedAscEvents[actualIndex];
    const leafIndex = Number(event.leafIndex);
    assert(!isNaN(leafIndex), `leafIndex is NaN, event=${event}`);
    assert(actualIndex === leafIndex, `leafIndex is not continuous, leafIndex=${leafIndex}, index=${actualIndex}`);
  }

  const nextLeafIndex = cipherTree.nextIndex;
  // insert commitment to tree from nextLeafIndex
  for(let leafIndex = nextLeafIndex; leafIndex < sortedAscEvents.length; leafIndex++) {
    const event = sortedAscEvents[leafIndex];
    const commitment = event.commitment;
    assert(commitment !== undefined, `commitment is undefined`);
    cipherTree.insert(BigInt(commitment));
  }
  return cipherTree;
}

export async function getCipherCommitmentLogs(publicClient: PublicClient,fromBlock: bigint, toBlock: bigint) {
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
