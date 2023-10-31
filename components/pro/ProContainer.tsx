import { Box, Button, Divider, Flex, Spacer, Text } from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import SelectBox from "./SelectBox";
import { getTokenConfig } from "../../lib/getTokenConfig";
import { TokenConfig } from "../../type";
import PrivateInputBox from "./PrivateInputBox";
import PublicInput from "../PublicInput";
import { useAccount, useBalance } from "wagmi";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../../configs/tokenConfig";
import { useErc20 } from "../../hooks/useErc20";
import PrivateOutputBox from "./PrivateOutputBox";
import PublicOutput from "../PublicOutput";
import {
  CipherTxProvider,
  CipherTxProviderContext,
} from "./ProCipherTxContext";
import { formatUnits } from "viem";

export default function ProContainer() {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<TokenConfig[]>(getTokenConfig(1));
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(tokens[0]);
  const { balance: Erc20Balance } = useErc20(selectedToken?.address);

  const { data: ethBalance } = useBalance({
    address: address,
  });
  const [balance, setBalance] = useState<bigint | undefined>(
    ethBalance?.value || 0n
  );
  const [privOutAmts, setPrivOutAmts] = useState<bigint[]>([]);

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
                      <PublicInput
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
              <Flex
                className="w-full py-6 flex flex-row justify-between items-center gap-8 rounded-3xl shadow-md grid-cols-3 px-12 my-6"
                bgColor={"whiteAlpha.400"}
                backdropFilter="blur(10px)"
              >
                <Button
                  className="w-full py-6"
                  borderRadius="full"
                  textColor={"white"}
                  bgColor="whiteAlpha.400"
                  _hover={{
                    cursor: "not-allowed",
                  }}
                  _active={{
                    bgColor: "whiteAlpha.400",
                  }}
                  transitionDuration={"0.2s"}
                >
                  select relayer
                </Button>
                <Flex className="w-full h-full flex flex-col justify-center items-center">
                  <Flex className="w-full h-1/2 flex flex-row justify-center items-center text-white">
                    <Text color="whiteAlpha.700" className="w-2/5 text-right">
                      Input:{" "}
                      {formatUnits(
                        publicInAmt + totalPrivateInAmt,
                        selectedToken.decimals
                      )}
                    </Text>
                    <Divider
                      orientation="vertical"
                      className="mx-4 h-full"
                      borderColor="whiteAlpha.700"
                    />
                    <Text color="whiteAlpha.700" className="w-2/5 text-left">
                      Output:{" "}
                      {formatUnits(
                        publicOutAmt + totalPrivateOutAmt,
                        selectedToken.decimals
                      )}
                    </Text>
                  </Flex>
                  {publicInAmt + totalPrivateInAmt ===
                  publicOutAmt + totalPrivateOutAmt ? undefined : (
                    <Text
                      className="w-full text-center"
                      textColor="rgba(255, 157, 169, 1)"
                    >
                      Amount not equal
                    </Text>
                  )}
                </Flex>
                <Button
                  className="w-full py-6"
                  borderRadius="full"
                  textColor={"white"}
                  bgColor="whiteAlpha.400"
                  _hover={{
                    transform: "scale(1.05)",
                    bgColor: "white",
                    textColor: "#6B39AB",
                  }}
                  _active={{
                    transform: "scale(0.95)",
                  }}
                  transitionDuration={"0.2s"}
                >
                  Send transaction
                </Button>
              </Flex>
            </Flex>
          );
        }}
      </CipherTxProviderContext.Consumer>
    </CipherTxProvider>
  );
}
