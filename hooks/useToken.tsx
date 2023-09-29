import {
  GOERLI_TOKEN_CONFIG,
  MAINNET_TOKEN_CONFIG,
} from "../configs/tokenConfig";
import { TokenConfig } from "../type";
import { useQuery } from "@tanstack/react-query";

export const useToken = (chainId: number) => {
  const {
    data: tokens,
    isLoading: isLoadingTokens,
    refetch: refetchTokens,
  } = useQuery({
    queryKey: ["getTokens"],
    queryFn: () => getTokenConfig(chainId),
    enabled: true,
  });

  return { tokens, isLoadingTokens, refetchTokens };
};

// TODO: remove and change to use on-chain data
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
