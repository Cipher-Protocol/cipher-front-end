import React, { useContext } from "react";
import {
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
  useToast,
  Image,
  Box,
} from "@chakra-ui/react";
import { CopyIcon, LockIcon, StarIcon } from "@chakra-ui/icons";
import { CipherAccountContext } from "../providers/CipherProvider";
import profileImage from "../assets/images/profile.png";
import { useAccount } from "wagmi";

export default function CipherProfileBtn() {
  const { isConnected } = useAccount();
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { cipherAccount, isAuthenticated, signAuthAsync } =
    useContext(CipherAccountContext);
  const toast = useToast();

  const copy = () => {
    navigator.clipboard.writeText(cipherAccount?.userId || "");
    onClose();
    toast({
      title: "User ID copied",
      description: "",
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "top",
    });
  };

  const handleSignAuth = async () => {
    if (!isConnected) {
      toast({
        title: "Please connect wallet",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    try {
      await signAuthAsync();
    } catch (e) {
      toast({
        title: "Sign authentication failed",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Flex className="mx-2 ">
      {isAuthenticated ? (
        <Menu onOpen={onToggle} onClose={onClose} isOpen={isOpen}>
          <MenuButton
            as={IconButton}
            className="flex justify-center items-center"
            bgColor="whiteAlpha.400"
            rounded="full"
            aria-label="Options"
            _hover={{
              cursor: "pointer",
              bgColor: "whiteAlpha.500",
              transform: "scale(1.1)",
            }}
            _active={{ bgColor: "whiteAlpha.500" }}
            onClick={onToggle}
            icon={
              <Image
                boxSize="20px"
                src={profileImage.src}
                _active={{ transform: "scale(0.9)" }}
                transitionDuration={"0.2s"}
                onClick={onToggle}
              />
            }
          />

          <MenuList
            className="w-32 overflow-x-auto px-2"
            bgColor="whiteAlpha.400"
            rounded="2xl"
            border={"none"}
          >
            <MenuItem
              icon={<CopyIcon />}
              className="whitespace-nowrap px-2"
              textColor={"white"}
              bgColor="transparent"
              rounded="xl"
              _hover={{
                bgColor: "white",
                textColor: "#6B39AB",
              }}
              overflow={"scroll"}
              onClick={() => copy()}
            >
              User ID: {cipherAccount && cipherAccount.userId}
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <Box
          as={IconButton}
          className="flex justify-center items-center"
          bgColor="whiteAlpha.400"
          rounded="full"
          _hover={{
            cursor: "pointer",
            bgColor: "whiteAlpha.500",
            transform: "scale(1.1)",
          }}
          _active={{ transform: "scale(0.9)" }}
          transitionDuration={"0.2s"}
        >
          <LockIcon
            boxSize="20px"
            onClick={handleSignAuth}
            textColor={"white"}
          />
        </Box>
      )}
    </Flex>
  );
}
