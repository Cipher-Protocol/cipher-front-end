import { TokenConfig } from "@/type";
import ethIcon from "@/assets/icon/eth.png";
import btcIcon from "@/assets/icon/btc.png";
import usdcIcon from "@/assets/icon/usdc.png";

// TODO: change to use on-chain data
export const DEFAULT_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const MAINNET_ADDRESS = {
  BTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
};
export const GOERLI_ADDRESS = {
  USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
};

export const MAINNET_TOKEN_CONFIG: TokenConfig[] = [
  {
    iconUri: ethIcon,
    address: DEFAULT_ETH_ADDRESS,
    symbol: "ETH",
  },
  {
    iconUri: btcIcon,
    address: MAINNET_ADDRESS.BTC,
    symbol: "BTC",
  },
];

export const GOERLI_TOKEN_CONFIG: TokenConfig[] = [
  {
    iconUri: ethIcon,
    address: DEFAULT_ETH_ADDRESS,
    symbol: "ETH",
  },
  {
    iconUri: usdcIcon,
    address: GOERLI_ADDRESS.USDC,
    symbol: "USDC",
  },
];
