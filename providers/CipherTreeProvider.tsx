import { createContext, use, useCallback, useMemo, useState } from "react";
import { CipherTree } from "../lib/cipher/CipherTree";
import { watchContractEvent, readContract, getWalletClient } from '@wagmi/core'
import CipherAbi from '../assets/Cipher-abi.json';
import { BigNumber, Contract, Wallet } from "ethers";
import { CIPHER_CONTRACT_ADDRESS } from "../configs/tokenConfig";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getContract, parseAbiItem } from "viem";

export const CipherTreeProviderContext = createContext<{
  tokenTreeMap: Map<string, CipherTree>;
  syncTree: (cipherAddress: string) => void;
  getTreeDepth: (cipherAddress: string, token: string) => Promise<number>;
  getTreeNextLeafIndex: (cipherAddress: string, token: string) => Promise<number>;
  getIsNullified: (cipherAddress: string, token: string, nullifier: bigint) => Promise<boolean>;
}>({
  tokenTreeMap: new Map<string, CipherTree>(),
  syncTree: (cipherAddress: string) => {},
  getTreeDepth: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
  getTreeNextLeafIndex: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
  getIsNullified: async (cipherAddress: string, token: string, nullifier: bigint) => { throw new Error("not implemented"); },
});
export const CipherTreeProvider = ({ children }: { children: React.ReactNode }) => {
  const publicClient = usePublicClient();
  useCallback(async () => {
    const filter = await publicClient.createEventFilter({ 
      address: CIPHER_CONTRACT_ADDRESS,
      event: parseAbiItem('event NewCommitment(address indexed token, uint256 newRoot, uint256 commitment, uint256 leafIndex)'),
    })
    // publicClient.getFilterLogs({

    // })
    const walletClient = await getWalletClient()
    // const cipherContract = getContract({
    //   address: CIPHER_CONTRACT_ADDRESS,
    //   abi: CipherAbi.abi,
    //   walletClient: walletClient,
    // })

  }, [

  ])

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
  const syncTree = (cipherAddress: string,) => {
    console.log('syncTree');
    const unwatch = watchContractEvent(
      {
        address: cipherAddress as `0x${string}`,
        abi: CipherAbi.abi,
        eventName: 'NewCommitment',
      },
      (log) => {
        console.log('syncTree', log);
      },
    )
  }
  return (
    <CipherTreeProviderContext.Provider
      value={{
        tokenTreeMap: new Map<string, CipherTree>(),
        syncTree,
        getTreeDepth,
        getTreeNextLeafIndex,
        getIsNullified,
      }}
    >
      {children}
    </CipherTreeProviderContext.Provider>
  )
};
// const signer!: Wallet;
// const parseEvents = async (tokenAdress: string, fromBlock: number, toBlock: number) => {
//   const filters = cipherContract.filters.NewCommitment(tokenAdress);
//   const events = await cipherContract.queryFilter(
//     filters,
//     fromBlock,
//     toBlock
//   );
//   console.log(`> find ${events.length} events.....`);
//   return events;
// }

// async function run() {
//   const fromBlock = 0;
//   const SYNC_BLOCKS_NUMBER_PER_BATCH = 10000;
//   const tokenAddress = '';
//   let currentStartBlock =  fromBlock;
//   let currentEndBlock =  fromBlock + SYNC_BLOCKS_NUMBER_PER_BATCH;
//   const latestBlock = await provider.getBlockNumber();
//   currentEndBlock = currentEndBlock > latestBlock ? latestBlock : currentEndBlock;

//   const result: {
//     fromBlock: number;
//     endBlock: number;
//     events: any[];
//   } = {
//     fromBlock,
//     endBlock: latestBlock,
//     events: [],
//   }

//   while (currentEndBlock <= latestBlock) {
//       console.log(`parsing ${currentStartBlock} ~ ${currentEndBlock} (EndBlockNumber=${latestBlock}) ......`);
//       try {
//           // TODO: retry
//           const events = await parseEvents(tokenAddress, currentStartBlock, currentEndBlock);
//           result.events = result.events.concat(events);

//           await delay(Math.floor(Math.random() * 500 + 300))
//           currentStartBlock = currentEndBlock + 1;
//           currentEndBlock = currentEndBlock + SYNC_BLOCKS_NUMBER_PER_BATCH > latestBlock ? latestBlock : currentEndBlock + SYNC_BLOCKS_NUMBER_PER_BATCH;
//           if (currentStartBlock > latestBlock) {
//               break;
//           }
//         } catch (error) {
//           console.error(error);
//       }
//   }
// }

// function delay(time: number) {
//   return new Promise((resolve) => {
//       setTimeout(() => {
//           resolve(true);
//       }, time);
//   });
// }


// function getNewProvider(): any {
//   throw new Error("Function not implemented.");
// }
