import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { erc20ABI } from "wagmi";
import {
  DEFAULT_NATIVE_TOKEN_ADDRESS,
} from "../configs/tokenConfig";
import { maxUint256 } from "viem";

export const useAllowance = (
  cipherContractAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) => {
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useQuery({
    queryKey: ["getAllowance", tokenAddress, spenderAddress],
    queryFn: () => getAllowance(cipherContractAddress, tokenAddress, spenderAddress),
    enabled: true,
  });

  return { allowance, isLoadingAllowance, refetchAllowance };
};

const getAllowance = async (
  cipherContractAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  address: `0x${string}` | undefined
) => {
  if (!tokenAddress || !address) return BigInt(0);
  if (tokenAddress === DEFAULT_NATIVE_TOKEN_ADDRESS) return maxUint256;
  if (!cipherContractAddress) return BigInt(0);
  const allowance = await readContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address, cipherContractAddress],
  });
  return allowance;
};
