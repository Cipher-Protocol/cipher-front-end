import { erc20ABI, useAccount, useContractRead } from "wagmi";

export const useErc20 = (tokenAddr: `0x${string}` | undefined) => {
  const { address } = useAccount();

  const { data: balance } = useContractRead({
    address: tokenAddr,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address || "0x"],
  });

  const { data: decimals } = useContractRead({
    address: tokenAddr,
    abi: erc20ABI,
    functionName: "decimals",
  });

  return { balance, decimals };
};
