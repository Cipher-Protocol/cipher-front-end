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
import React from "react";
import { TokenConfig } from "@/type";

type Props = {
  tokens: TokenConfig[] | undefined;
  selectedToken: TokenConfig | undefined;
  isLoadingTokens: boolean;
  setSelectedToken: React.Dispatch<
    React.SetStateAction<TokenConfig | undefined>
  >;
};
export default function TokenSelector(props: Props) {
  const { tokens, selectedToken, isLoadingTokens, setSelectedToken } = props;

  return (
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
        {isLoadingTokens ? (
          <Skeleton height="20px" width="85%" className="m-auto" />
        ) : (
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
        )}
      </MenuList>
    </Menu>
  );
}
