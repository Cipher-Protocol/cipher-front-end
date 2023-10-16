import { TokenConfig } from "../type";
import ethIcon from "../assets/icon/eth.png";
import btcIcon from "../assets/icon/btc.png";
import usdcIcon from "../assets/icon/usdc.png";

export const CIPHER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CIPHER_CONTRACT_ADDRESS as `0x${string}`;

export const SNARK_FIELD_SIZE =
  "21888242871839275222246405745257275088548364400416034343698204186575808495617";
export const DEFAULT_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
// TODO: change to use on-chain data
export const MAINNET_ADDRESS = {
  BTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" as const,
};
export const GOERLI_ADDRESS = {
  WBTC: "0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05" as const,
  USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F" as const,
};

export const MAINNET_TOKEN_CONFIG: TokenConfig[] = [
  {
    iconUri: ethIcon,
    address: DEFAULT_ETH_ADDRESS,
    symbol: "ETH",
    decimals: 18,
  },
  {
    iconUri: btcIcon,
    address: MAINNET_ADDRESS.BTC,
    symbol: "BTC",
    decimals: 8,
  },
];

export const GOERLI_TOKEN_CONFIG: TokenConfig[] = [
  {
    iconUri: ethIcon,
    address: DEFAULT_ETH_ADDRESS,
    symbol: "ETH",
    decimals: 18,
  },
  {
    iconUri: btcIcon,
    address: GOERLI_ADDRESS.WBTC,
    symbol: "WBTC",
    decimals: 8,
  },
  {
    iconUri: usdcIcon,
    address: GOERLI_ADDRESS.USDC,
    symbol: "USDC",
    decimals: 6,
  },
];
