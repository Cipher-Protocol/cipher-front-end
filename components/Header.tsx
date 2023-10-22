import { Box, ButtonGroup, Flex, Heading, Spacer } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { Dispatch, SetStateAction } from "react";
import SimpleBtn from "./SimpleBtn";
import { Mode } from "../type";
import ModeTab from "./ModeTab";
import CipherProfileBtn from "./CipherProfileBtn";
import { useAccount } from "wagmi";

type Props = {
  setMode: Dispatch<SetStateAction<Mode>>;
};

export default function Header(props: Props) {
  const { setMode } = props;
  const { isConnected } = useAccount();

  return (
    <Flex className="w-full p-4 gap-2 items-center">
      <Box className="p-2">
        <Heading size="md">Cipher</Heading>
      </Box>
      <Spacer />
      <ButtonGroup className="gap-2">
        <SimpleBtn colorScheme="teal" className="w-32">
          Integration
        </SimpleBtn>
        <SimpleBtn colorScheme="teal" className="w-32">
          Docs
        </SimpleBtn>
      </ButtonGroup>
      <ModeTab setMode={setMode} />
      <ConnectButton
        chainStatus="icon"
        accountStatus="address"
        showBalance={false}
      />
      {isConnected && <CipherProfileBtn />}
    </Flex>
  );
}
