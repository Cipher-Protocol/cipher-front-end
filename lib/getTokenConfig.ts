import {
  GOERLI_TOKEN_CONFIG,
  MAINNET_TOKEN_CONFIG,
} from "../configs/tokenConfig";
import { TokenConfig } from "../type";

export function getTokenConfig(chainId: number): TokenConfig[] {
  // mainnet
  if (chainId === 1) {
    return MAINNET_TOKEN_CONFIG;
    // goerli
  } else if (chainId === 5) {
    return GOERLI_TOKEN_CONFIG;
  } else {
    return MAINNET_TOKEN_CONFIG;
  }
}
