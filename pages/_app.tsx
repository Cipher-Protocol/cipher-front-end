import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, goerli, arbitrumGoerli } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { chakraTheme } from "../styles/chakraTheme";
import { rainbowkitTheme } from "../styles/rainbowkitTheme";
import { getString } from "../utils/helper";
import { CipherAccountProvider } from "../providers/CipherProvider";
import { CipherTreeProvider } from "../providers/CipherTreeProvider";
import { ConfigProvider } from "../providers/ConfigProvider";

/* ============== rainbowkit & wagmi config ============== */

const { chains, publicClient } = configureChains(
  [goerli, arbitrumGoerli],
  [
    alchemyProvider({ apiKey: getString(process.env.NEXT_PUBLIC_ALCHEMY_ID) }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "Cipher App",
  projectId: "29f089b368494e3fed5056775f80ee35",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors,
  publicClient,
});

// react-query config
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={chakraTheme}>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains} theme={rainbowkitTheme}>
            <ConfigProvider>
              <CipherAccountProvider>
                <CipherTreeProvider>
                  <Component {...pageProps} />
                </CipherTreeProvider>
              </CipherAccountProvider>
            </ConfigProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
