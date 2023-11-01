import { Box, Button, Divider, Flex, Spacer, Text } from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import SelectBox from "./SelectBox";
import { getTokenConfig } from "../../lib/getTokenConfig";
import { TokenConfig } from "../../type";
import PrivateInputBox from "./PrivateInputBox";
import { useAccount, useBalance, useNetwork } from "wagmi";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../../configs/tokenConfig";
import { useErc20 } from "../../hooks/useErc20";
import PrivateOutputBox from "./PrivateOutputBox";
import {
  CipherTxProvider,
  CipherTxProviderContext,
} from "./ProCipherTxContext";
import ConfirmBox from "./ConfirmBox";

export default function ProContainer() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const [tokens, setTokens] = useState<TokenConfig[]>(getTokenConfig(1));
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(tokens[0]);
  const { balance: Erc20Balance } = useErc20(selectedToken?.address);

  const { data: ethBalance } = useBalance({
    address: address,
  });
  const [balance, setBalance] = useState<bigint | undefined>(
    ethBalance?.value || 0n
  );

  useEffect(() => {
    const tokens = getTokenConfig(chain?.id || 1);
    setTokens(tokens);
  }, [chain]);

  useEffect(() => {
    if (!address) return;
    if (selectedToken?.address === DEFAULT_NATIVE_TOKEN_ADDRESS) {
      setBalance(ethBalance?.value || 0n);
    } else {
      if (selectedToken === undefined || Erc20Balance === undefined) {
        setBalance(undefined);
      } else {
        setBalance(Erc20Balance);
      }
    }
  }, [ethBalance, Erc20Balance, address, selectedToken]);

  /**
   * TODO:
   *
   * 1. collect tree first when selected token
   * 2. In Active input box
   *   - enter cipher code
   *     - valid cipher code format
   *     - valid in tree and didn't paid
   *     - confirm button and disable input
   *   - import by file
   *   - it have Holding Box, it can be drag to input box
   *   - Each CipherCode item have status check valid or not
   * 3. In
   */

  return (
    <CipherTxProvider tokenAddress={selectedToken?.address}>
      <CipherTxProviderContext.Consumer>
        {({
          publicInAmt,
          publicOutAmt,
          setPublicInAmt,
          setPublicOutAmt,
          privateInCoins,
          privateOutCoins,
          totalPrivateInAmt,
          totalPrivateOutAmt,
          downloadCipherCodes,
          sendTransaction,
          prepareProof,
        }) => {
          return (
            <Flex className="flex flex-col py-10 m-auto w-4/5 h-full justify-between">
              <Flex className="flex flex-col">
                <SelectBox
                  balance={balance}
                  publicInAmt={publicInAmt}
                  setPublicInAmt={
                    setPublicInAmt as React.Dispatch<
                      React.SetStateAction<bigint | undefined>
                    >
                  }
                  publicOutAmt={publicOutAmt}
                  setPublicOutAmt={
                    setPublicOutAmt as React.Dispatch<
                      React.SetStateAction<bigint | undefined>
                    >
                  }
                  tokens={tokens}
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  onDownload={downloadCipherCodes}
                  onPrepare={prepareProof}
                  onSendTransaction={sendTransaction}
                />
                <Flex className="flex flex-row justify-between rounded-3xl my-8 grid-cols-2 gap-8">
                  <PrivateInputBox selectedToken={selectedToken} />
                  {/* <Box className="my-4 px-8 py-2 mx-auto bg-slate-300 rounded-3xl">
                      <AmountSelector
                        pubInAmt={publicInAmt}
                        setPubInAmt={(v) =>
                          setPublicInAmt(v ? (v as bigint) : 0n)
                        }
                        selectedToken={selectedToken}
                        balance={balance}
                      />
                    </Box> */}

                  <PrivateOutputBox selectedToken={selectedToken} />
                  {/* <Box className="my-4 py-2 px-8 mx-auto bg-slate-300 rounded-3xl">
                      <PublicOutput
                        pubOutAmt={publicOutAmt}
                        setPubOutAmt={(v) =>
                          setPublicOutAmt(v ? (v as bigint) : 0n)
                        }
                        selectedToken={selectedToken}
                        balance={0n}
                      />
                    </Box> */}
                </Flex>
              </Flex>
              <ConfirmBox
                publicInAmt={publicInAmt}
                publicOutAmt={publicOutAmt}
                privateInCoins={privateInCoins}
                privateOutCoins={privateOutCoins}
                totalPrivateInAmt={totalPrivateInAmt}
                totalPrivateOutAmt={totalPrivateOutAmt}
                selectedToken={selectedToken}
              />
            </Flex>
          );
        }}
      </CipherTxProviderContext.Consumer>
    </CipherTxProvider>
  );
}
