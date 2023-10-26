import { ChainConfig } from "../type";
import { getBigInt, getString } from "../utils/helper";
import { mainnet, goerli, arbitrumGoerli } from "wagmi/chains";

// TODO: MIGRATE FROM .env
export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  switch (chainId) {
    case mainnet.id:
      return MAINNET_CONFIG;
    case goerli.id:
      return GOERLI_CONFIG;
    case arbitrumGoerli.id:
      return ARBITRUM_GOERLI_CONFIG;
    default:
      return undefined;
  }
};

export const MAINNET_CONFIG: ChainConfig = {
  cipherContractAddress: getString(
    process.env.NEXT_PUBLIC_MAINNET_CIPHER_CONTRACT_ADDRESS
  ) as `0x${string}`,
  startBlock: getBigInt(
    process.env.NEXT_PUBLIC_MAINNET_CIPHER_START_BLOCK_NUMBER
  ),
  isSubgraphEnabled: true,
};

export const GOERLI_CONFIG: ChainConfig = {
  cipherContractAddress: getString(
    process.env.NEXT_PUBLIC_GOERLI_CIPHER_CONTRACT_ADDRESS
  ) as `0x${string}`,
  startBlock: getBigInt(
    process.env.NEXT_PUBLIC_GOERLI_CIPHER_START_BLOCK_NUMBER
  ),
  isSubgraphEnabled: true,
};

export const ARBITRUM_GOERLI_CONFIG: ChainConfig = {
  cipherContractAddress: getString(
    process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_CIPHER_CONTRACT_ADDRESS
  ) as `0x${string}`,
  startBlock: getBigInt(
    process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_CIPHER_START_BLOCK_NUMBER
  ),
  isSubgraphEnabled: true,
};
