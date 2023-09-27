import {
  GOERLI_TOKEN_CONFIG,
  MAINNET_TOKEN_CONFIG,
} from "@/configs/tokenConfig";
import { TokenConfig } from "@/type";
import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "wagmi";

// export const useToken = () => {
//   const {
//     data: tokens,
//     isLoading: isTokensLoading,
//     refetch: refetchTokens,
//   } = useQuery({
//     queryKey: ["getTokens"],
//     queryFn: () => getTokenConfig(),
//     enabled: true,
//   });

//   return { tokens, isTokensLoading, refetchTokens };
// };

// TODO: remove and change to use on-chain data
export function getTokenConfig(chainId: number): TokenConfig[] {
  if (chainId === 1) {
    // mainnet
    return MAINNET_TOKEN_CONFIG;
  } else if (chainId === 5) {
    // goerli
    return GOERLI_TOKEN_CONFIG;
  } else {
    return MAINNET_TOKEN_CONFIG;
  }
}
