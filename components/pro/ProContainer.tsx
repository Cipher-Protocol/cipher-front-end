import { Box, Flex, SimpleGrid } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
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

export default function ProContainer() {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<TokenConfig[]>(getTokenConfig(1));
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(tokens[0]);
  const { balance: Erc20Balance } = useErc20(selectedToken?.address);
  const [pubInAmt, setPubInAmt] = useState<bigint>();
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
    <SimpleGrid columns={3} className="flex justify-center p-8 w-full h-full">
      <Flex className="flex flex-col justify-between bg-slate-200 rounded-3xl">
        <PrivateInputBox />
        <Box className="my-4 px-8 py-2 mx-auto bg-slate-300 rounded-3xl">
          <PublicInput
            pubInAmt={pubInAmt}
            setPubInAmt={setPubInAmt}
            selectedToken={selectedToken}
            balance={balance}
          />
        </Box>
      </Flex>
      <Box className="flex items-center px-4">
        <SelectBox
          tokens={tokens}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
        />
      </Box>
      <Flex className="flex flex-col justify-between bg-slate-200 rounded-3xl">
        <PrivateOutputBox selectedToken={selectedToken} />
        <Box className="my-4 py-2 px-8 mx-auto bg-slate-300 rounded-3xl">
          <PublicOutput />
        </Box>
      </Flex>
    </SimpleGrid>
  );
}
