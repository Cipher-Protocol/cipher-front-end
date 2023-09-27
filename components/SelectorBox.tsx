import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Image,
  Flex,
  Skeleton,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import React, { useEffect, useState } from "react";
import Btn from "./Btn";
import { TokenConfig } from "@/type";
import { getTokenConfig } from "@/hooks/useToken";
import { useNetwork } from "wagmi";

export default function SelectorBox() {
  const { chain } = useNetwork();
  const [tokens, setTokens] = useState<TokenConfig[]>(getTokenConfig(1));
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(tokens[0]);

  useEffect(() => {
    if (chain) {
      setTokens(getTokenConfig(chain.id));
    }
  }, [chain]);

  return (
    <Flex className="flex flex-col justify-between items-center h-[20rem] w-[25rem] p-4 bg-red-500 rounded-3xl">
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          borderRadius={"3xl"}
          className="w-56"
        >
          <Flex className="flex flex-row items-center gap-4">
            {selectedToken ? (
              <>
                <Image
                  className="rounded-full"
                  boxSize="25px"
                  src={selectedToken?.iconUri.src}
                  alt=""
                />
                {selectedToken?.symbol}
              </>
            ) : (
              <Skeleton height="20px" width="full" />
            )}
          </Flex>
        </MenuButton>
        <MenuList borderRadius={"3xl"} className="rounded-3xl w-56 px-2 py-2">
          {tokens ? (
            tokens?.map((token) => (
              <MenuItem
                key={token.symbol}
                borderRadius={"3xl"}
                className="flex flex-row items-center gap-4"
                onClick={() => setSelectedToken(token)}
              >
                <Image
                  borderRadius="full"
                  boxSize="25px"
                  src={token.iconUri.src}
                  alt={token.symbol}
                />
                {token.symbol}
              </MenuItem>
            ))
          ) : (
            <Skeleton height="20px" width="85%" className="m-auto" />
          )}
        </MenuList>
      </Menu>
      <Btn colorScheme={"teal"} className="w-56">
        Send Tx
      </Btn>
    </Flex>
  );
}
