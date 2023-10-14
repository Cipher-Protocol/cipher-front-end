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
} from "@chakra-ui/react";
import { CopyIcon, LockIcon, StarIcon } from "@chakra-ui/icons";
import { CipherAccountContext } from "../providers/CipherProvider";

export default function CipherProfileBtn() {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { cipherAccount, isAuthenticated, signAuth } =
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

  return (
    <Flex className="mx-2">
      {isAuthenticated ? (
        <Menu onOpen={onToggle} onClose={onClose} isOpen={isOpen}>
          <MenuButton
            className="flex justify-center items-center"
            rounded={"full"}
            border={"none"}
            as={IconButton}
            aria-label="Options"
            onClick={onToggle}
            bgColor={"transparent"}
            icon={
              <StarIcon
                boxSize="25px"
                _hover={{
                  cursor: "pointer",
                  opacity: 0.8,
                  transform: "scale(1.1)",
                }}
                _active={{ transform: "scale(0.9)" }}
                transitionDuration={"0.2s"}
                onClick={onToggle}
              />
            }
          />

          <MenuList className="w-32 overflow-x-auto">
            <MenuItem
              icon={<CopyIcon />}
              className="whitespace-nowrap"
              onClick={() => copy()}
            >
              User ID: {cipherAccount && cipherAccount.userId}
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <LockIcon
          boxSize="25px"
          _hover={{
            cursor: "pointer",
            opacity: 0.8,
            transform: "scale(1.1)",
          }}
          _active={{ transform: "scale(0.9)" }}
          transitionDuration={"0.2s"}
          onClick={signAuth}
        />
      )}
    </Flex>
  );
}
