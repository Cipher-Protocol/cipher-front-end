import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { erc20ABI } from "wagmi";
import {
  CIPHER_CONTRACT_ADDRESS,
  DEFAULT_ETH_ADDRESS,
} from "../configs/tokenConfig";
import { maxUint256 } from "viem";

export const useAllowance = (
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) => {
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useQuery({
    queryKey: ["getAllowance", tokenAddress, spenderAddress],
    queryFn: () => getAllowance(tokenAddress, spenderAddress),
    enabled: true,
  });

  return { allowance, isLoadingAllowance, refetchAllowance };
};

const getAllowance = async (
  tokenAddress: `0x${string}` | undefined,
  address: `0x${string}` | undefined
) => {
  if (!tokenAddress || !address) return BigInt(0);
  if (tokenAddress === DEFAULT_ETH_ADDRESS) return maxUint256;
  const allowance = await readContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address, CIPHER_CONTRACT_ADDRESS],
  });
  return allowance;
};
