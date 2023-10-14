import { createContext, useState } from "react";
import { CipherTree } from "../lib/cipher/CipherTree";
import { watchContractEvent, readContract } from '@wagmi/core'
import CipherAbi from '../assets/Cipher-abi.json';

export const CipherTreeProviderContext = createContext<{
  tokenTreeMap: Map<string, CipherTree>;
  syncTree: (cipherAddress: string) => void;
  getTreeDepth: (cipherAddress: string, token: string) => Promise<number>;
  getTreeNextLeafIndex: (cipherAddress: string, token: string) => Promise<number>;
}>({
  tokenTreeMap: new Map<string, CipherTree>(),
  syncTree: (cipherAddress: string) => {},
  getTreeDepth: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
  getTreeNextLeafIndex: async (cipherAddress: string, token: string) => { throw new Error("not implemented"); },
});
export const CipherTreeProvider = ({ children }: { children: React.ReactNode }) => {
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
      }}
    >
      {children}
    </CipherTreeProviderContext.Provider>
  )
};
