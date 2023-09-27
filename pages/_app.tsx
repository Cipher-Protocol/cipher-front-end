import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import "@/styles/globals.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, goerli } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getString } from "@/type";
import { chakraTheme } from "@/styles/chakraTheme";
import { rainbowkitTheme } from "@/styles/rainbowkitTheme";

/* ============== rainbowkit & wagmi config ============== */

const { chains, publicClient } = configureChains(
  [mainnet, goerli],
  [
    alchemyProvider({ apiKey: getString(process.env.NEXT_PUBLIC_ALCHEMY_ID) }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "My RainbowKit App",
  projectId: "utxo-front-end",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
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
            <Component {...pageProps} />
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
