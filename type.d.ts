declare module "circomlibjs";

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

export type TokenConfig = {
  iconUri: StaticImageData;
  address: `0x${string}`;
  symbol: string;
};

export type CipherAccount = {
  seed: string;
  userId: string;
};

// from wagmi
export type FetchBalanceResult = {
  decimals: number;
  formatted: string;
  symbol: string;
  value: bigint;
};
