import { erc20ABI, useAccount } from "wagmi";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../configs/tokenConfig";
import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";

export const useErc20 = (tokenAddr: `0x${string}` | undefined) => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<bigint | undefined>(0n);
  const [decimals, setDecimals] = useState<number | undefined>(18);

  useEffect(() => {
    setIsLoading(true);
    if (
      !address ||
      tokenAddr === undefined ||
      tokenAddr === DEFAULT_NATIVE_TOKEN_ADDRESS
    ) {
      setBalance(0n);
      setIsLoading(false);
      return;
    }
    readContract({
      address: tokenAddr as `0x${string}`,
      abi: erc20ABI,
      functionName: "balanceOf",
      args: [address || "0x"],
    })
      .then((data) => {
        setBalance(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [tokenAddr, address]);

  useEffect(() => {
    if (
      !address ||
      tokenAddr === undefined ||
      tokenAddr === DEFAULT_NATIVE_TOKEN_ADDRESS
    ) {
      setDecimals(undefined);
      setIsLoading(false);
      return;
    }
    readContract({
      address: tokenAddr as `0x${string}`,
      abi: erc20ABI,
      functionName: "decimals",
    })
      .then((data) => {
        setDecimals(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [address, tokenAddr]);

  return { balance, decimals, isLoading };
};
