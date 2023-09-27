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
    <Flex
      h={"20rem"}
      w={"25rem"}
      p={"1rem"}
      bgColor={"red"}
      justify={"space-between"}
      align={"center"}
      textAlign={"center"}
      borderRadius={"3xl"}
      flexDirection={"column"}
    >
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          w={"14rem"}
          borderRadius={"3xl"}
        >
          <Flex
            flexDirection={"row"}
            textAlign={"center"}
            align={"center"}
            gap={"1rem"}
          >
            <Image
              borderRadius="full"
              boxSize="30px"
              src={selectedToken.iconUri}
              alt=""
            />
            {selectedToken.symbol}
          </Flex>
        </MenuButton>
        <MenuList borderRadius={"3xl"} w={"14rem"} px={"0.5rem"}>
          {tokenConfig.map((token) => (
            <MenuItem
              key={token.symbol}
              borderRadius={"3xl"}
              gap={"1rem"}
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
      <Btn colorScheme={"teal"} w={"14rem"} borderRadius={"3xl"}>
        Send Tx
      </Btn>
    </Flex>
  );
}
