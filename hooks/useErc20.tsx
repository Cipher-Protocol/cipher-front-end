import { erc20ABI, useAccount, useContractRead } from "wagmi";
import { DEFAULT_ETH_ADDRESS } from "../configs/tokenConfig";
import { use, useEffect, useState } from "react";
import { BigNumber } from "ethers";

export const useErc20 = (tokenAddr: `0x${string}` | undefined) => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<BigNumber | undefined>(
    BigNumber.from(0)
  );
  const [decimals, setDecimals] = useState<number | undefined>(18);

  if (tokenAddr === DEFAULT_ETH_ADDRESS || tokenAddr === undefined)
    return { balance: undefined, decimals: undefined, isLoading: false };

  if (address === undefined)
    return { balance: undefined, decimals: undefined, isLoading: false };

  useEffect(() => {
    setIsLoading(true);
    const { data: erc20Balance } = useContractRead({
      address: tokenAddr,
      abi: erc20ABI,
      functionName: "balanceOf",
      args: [address || "0x"],
    });
    setBalance(BigNumber.from(erc20Balance));
    setIsLoading(false);
  }, [tokenAddr, address]);

  useEffect(() => {
    setIsLoading(true);
    const { data: erc20Decimals } = useContractRead({
      address: tokenAddr,
      abi: erc20ABI,
      functionName: "decimals",
    });
    setDecimals(erc20Decimals);
    setIsLoading(false);
  }, [tokenAddr]);

  return { balance, decimals, isLoading };
};
