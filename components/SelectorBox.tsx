import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Image,
  Flex,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import React, { useState } from "react";
import { tokenConfig } from "@/configs/tokenConfig";
import Btn from "./Btn";
import { TokenConfig } from "@/type";

export default function SelectorBox() {
  const [selectedToken, setSelectedToken] = useState<TokenConfig>(
    tokenConfig[0]
  );
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
            <Image
              className="rounded-full"
              boxSize="30px"
              src={selectedToken.iconUri}
              alt=""
            />
            {selectedToken.symbol}
          </Flex>
        </MenuButton>
        <MenuList borderRadius={"3xl"} className="rounded-3xl w-56 px-2 py-2">
          {tokenConfig.map((token) => (
            <MenuItem
              key={token.symbol}
              borderRadius={"3xl"}
              className="flex flex-row items-center gap-4"
              onClick={() => setSelectedToken(token)}
            >
              <Image
                borderRadius="full"
                boxSize="30px"
                src={token.iconUri}
                alt={token.symbol}
              />
              {token.symbol}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      <Btn colorScheme={"teal"} className="w-56">
        Send Tx
      </Btn>
    </Flex>
  );
}
