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
  iconUri: StaticImageData;
  address: string;
  symbol: string;
};
