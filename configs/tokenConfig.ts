import { TokenConfig } from "../type";
import ethIcon from "../assets/icon/ethereum-pos.png";
import btcIcon from "../assets/icon/wrapped-bitcoin.png";
import usdcIcon from "../assets/icon/usd-coin-wormhole-from-ethereum.png";
import wethIcon from "../assets/icon/wrapped-ethereum.png";

export const SNARK_FIELD_SIZE =
  "21888242871839275222246405745257275088548364400416034343698204186575808495617";
export const DEFAULT_NATIVE_TOKEN_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// TODO: change to use on-chain data
export const MAINNET_ADDRESS = {
  BTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" as const,
};
export const GOERLI_ADDRESS = {
  WBTC: "0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05" as const,
  USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F" as const,
};

export const ARBITRUM_GOERLI_ADDRESS = {
  WETH: "0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3" as const,
  USDC: "0x8FB1E3fC51F3b789dED7557E680551d93Ea9d892" as const,
};

export const MAINNET_TOKEN_CONFIG: TokenConfig[] = [
  {
    iconUri: ethIcon,
    address: DEFAULT_NATIVE_TOKEN_ADDRESS,
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
    address: DEFAULT_NATIVE_TOKEN_ADDRESS,
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

export const ARBITRUM_GOERLI_TOKEN_CONFIG: TokenConfig[] = [
  {
    iconUri: ethIcon,
    address: DEFAULT_NATIVE_TOKEN_ADDRESS,
    symbol: "ETH",
    decimals: 18,
  },
  {
    iconUri: wethIcon,
    address: ARBITRUM_GOERLI_ADDRESS.WETH,
    symbol: "WETH",
    decimals: 18,
  },
  {
    iconUri: usdcIcon,
    address: ARBITRUM_GOERLI_ADDRESS.USDC,
    symbol: "USDC",
    decimals: 6,
  },
];
