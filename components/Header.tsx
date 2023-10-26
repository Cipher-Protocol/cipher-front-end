import {
  Box,
  ButtonGroup,
  Flex,
  Heading,
  Spacer,
  Image,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { Dispatch, SetStateAction } from "react";
import SimpleBtn from "./SimpleBtn";
import { Mode } from "../type";
import ModeTab from "./ModeTab";
import CipherProfileBtn from "./CipherProfileBtn";
import { useAccount } from "wagmi";
import logo from "../assets/images/logo1.png";

type Props = {
  setMode: Dispatch<SetStateAction<Mode>>;
};

export default function Header(props: Props) {
  const { setMode } = props;
  const { isConnected } = useAccount();

  return (
    <Flex className="w-full p-4 gap-2 items-center justify-between">
      <Box className="py-2 pl-8 w-[30%]">
        <Image
          src={logo.src}
          h={8}
          _hover={{
            cursor: "pointer",
            transform: "scale(1.1)",
          }}
          _active={{
            transform: "scale(0.9)",
          }}
          transitionDuration={"0.2s"}
          alt="logo"
        />
      </Box>
      {/* <SimpleBtn colorScheme="teal" className="w-32">
          Integration
        </SimpleBtn>
        <SimpleBtn colorScheme="teal" className="w-32">
          Docs
        </SimpleBtn> */}
      <ModeTab setMode={setMode} />
      <Box className="flex flex-row pr-8 justify-end w-[30%] gap-2">
        <ConnectButton
          chainStatus="icon"
          accountStatus="address"
          showBalance={false}
        />
        {isConnected && <CipherProfileBtn />}
      </Box>
    </Flex>
  );
}
