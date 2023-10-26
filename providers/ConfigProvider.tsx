import { createContext, useMemo } from "react";
import { ChainConfig } from "../type";
import { getChainConfig } from "../configs/chainConfig";
import { usePublicClient } from "wagmi";


export const ConfigContext = createContext<{
  cipherContractInfo: ChainConfig | undefined;
}>({
  cipherContractInfo: undefined,
});


export const ConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const publicClient = usePublicClient();
  const cipherContractInfo = useMemo(() => {
    return getChainConfig(
      publicClient.chain.id
    );
  }, [publicClient]);


  return <ConfigContext.Provider value={{ 
    cipherContractInfo,
    
  }}>
    {children}
  </ConfigContext.Provider>;
}