declare module "circomlibjs";
declare module "snarkjs";
declare global {
  interface Window {
    ethereum: any;
  }
}

export enum Mode {
  SIMPLE,
  PRO,
}

export enum SimpleType {
  DEPOSIT,
  WITHDRAW,
}

export type ChainConfig = {
  cipherContractAddress: `0x${string}`;
  startBlock: bigint;
  isSubgraphEnabled: boolean;
};

export type TokenConfig = {
  iconUri: StaticImageData;
  address: `0x${string}`;
  symbol: string;
  decimals: number;
};

export type CipherAccount = {
  seed: string | undefined;
  userId: string | undefined;
};

// from wagmi
export type FetchBalanceResult = {
  decimals: number;
  formatted: string;
  symbol: string;
  value: bigint;
};
