import { PublicClient } from "viem";
import { CipherTree } from "../CipherTree";

export interface NewCommitmentLogType {
  blockNumber: string,
  leafIndex: string,
  commitment: string,
  newRoot?: string,
}
export type NewCommitmentLogsType = NewCommitmentLogType[];
// type NewCommitmentLogsType = Awaited<ReturnType<typeof getCipherCommitmentLogs>>
export interface TreeCacheItem {
  cipherTree: CipherTree;
  fromBlock: bigint;
  endBlock: bigint;
  events: NewCommitmentLogsType;
  isSyncing: boolean;
}
export interface TreeSyncingQueueContext {
  publicClient: PublicClient,
  currentStartBlock: bigint,
  currentEndBlock: bigint,
  batchSize: bigint,
  latestBlockNumber: bigint,
  isStop: boolean,
}
export interface TreeSyncingQueueItem {
  promise: Promise<TreeCacheItem>,
  context: TreeSyncingQueueContext,
}

