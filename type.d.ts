declare module "circomlibjs";

export enum Mode {
  SIMPLE,
  PRO,
}

export enum SimpleType {
  DEPOSIT,
  WITHDRAW,
}

export type TokenConfig = {
  iconUri: string;
  address: string;
  symbol: string;
};
