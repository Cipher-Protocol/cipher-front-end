import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Image,
  Flex,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import React from "react";
import { TokenConfig } from "../type";

type Props = {
  tokens: TokenConfig[] | undefined;
  selectedToken: TokenConfig | undefined;
  isLoadingTokens?: boolean;
  setSelectedToken: React.Dispatch<React.SetStateAction<TokenConfig>>;
};
export default function TokenSelector(props: Props) {
  const { tokens, selectedToken, isLoadingTokens, setSelectedToken } = props;

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon color="white" boxSize="30px" />}
        borderRadius="3xl"
        bgColor={"whiteAlpha.400"}
        _hover={{ bgColor: "whiteAlpha.500" }}
        className="w-full p-6"
        _active={{ bgColor: "whiteAlpha.500" }}
      >
        <Flex className="flex flex-row items-center gap-4">
          {selectedToken ? (
            <>
              <Image
                className="rounded-full"
                boxSize="30px"
                src={selectedToken?.iconUri.src}
                alt=""
              />
              <Text className="text-white">{selectedToken?.symbol}</Text>
            </>
          ) : (
            <Skeleton height="20px" width="full" />
          )}
        </Flex>
      </MenuButton>
      <MenuList
        borderRadius={"3xl"}
        bgColor={"whiteAlpha.500"}
        className="rounded-3xl px-2 py-2 border-none"
        backdropFilter={"blur(10px)"}
        // mixBlendMode={"multiply"}
        minW="0"
        w={"320px"}
      >
        {isLoadingTokens ? (
          <Skeleton height="20px" width="85%" className="m-auto" />
        ) : (
          tokens?.map((token) => (
            <MenuItem
              key={token.symbol}
              borderRadius={"3xl"}
              bgColor={"transparent"}
              _hover={{ bgColor: "whiteAlpha.500" }}
              className="flex flex-row items-center gap-4"
              textColor={"white"}
              fontWeight={"base"}
              onClick={() => setSelectedToken(token)}
            >
              <Image
                borderRadius="full"
                boxSize="30px"
                src={token.iconUri.src}
                alt={token.symbol}
              />
              {token.symbol}
            </MenuItem>
          ))
        )}
      </MenuList>
    </Menu>
  );
}
