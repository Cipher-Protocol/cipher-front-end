import { erc20ABI, useAccount, useContractRead } from "wagmi";
import { DEFAULT_ETH_ADDRESS } from "../configs/tokenConfig";
import { use, useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { readContract } from '@wagmi/core'

export const useErc20 = (tokenAddr: `0x${string}` | undefined) => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<BigNumber | undefined>(
    BigNumber.from(0)
  );
  const [decimals, setDecimals] = useState<number | undefined>(18);

  useEffect(() => {
    setIsLoading(true);
    if (!address || tokenAddr === undefined || tokenAddr === DEFAULT_ETH_ADDRESS) {
      setBalance(BigNumber.from(0));
      setIsLoading(false);
      return;
    }
    readContract({
      address: tokenAddr as `0x${string}`,
      abi: erc20ABI,
      functionName: "balanceOf",
      args: [address || "0x"],
    }).then((data) => {
      setBalance(BigNumber.from(data));
      setIsLoading(false);
    }).catch((err) => {
      console.error(err)
      setIsLoading(false);
    })
  }, [tokenAddr, address]);

  useEffect(() => {
    if (!address || tokenAddr === undefined || tokenAddr === DEFAULT_ETH_ADDRESS) {
      setDecimals(undefined);
      setIsLoading(false);
      return;
    }
    readContract({
      address: tokenAddr as `0x${string}`,
      abi: erc20ABI,
      functionName: "decimals",
    }).then((data) => {
      setDecimals(data);
      setIsLoading(false);
    }).catch((err) => {
      console.error(err)
      setIsLoading(false);
    })
  }, [address, tokenAddr]);

  return { balance, decimals, isLoading };
};
