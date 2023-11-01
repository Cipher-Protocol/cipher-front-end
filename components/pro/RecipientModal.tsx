import {
  Box,
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Image,
  Card,
  Checkbox,
} from "@chakra-ui/react";
import React, { ChangeEvent, ChangeEventHandler, useState } from "react";
import showImage from "../../assets/images/hide1.png";
import hideImage from "../../assets/images/hide2.png";

type Props = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  userId?: string;
  onValueChange?: (value: string) => void;
};

export default function RecipientModal(props: Props) {
  const { isOpen, onOpen, onClose } = props;
  const { userId, onValueChange } = props;
  const [show, setShow] = useState(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const handleClick = () => setShow(!show);

  const onChange: ChangeEventHandler = (event: ChangeEvent) => {
    const ele = event.target as HTMLInputElement;
    const data = ele.value;
    if (userId === data) return;
    if (onValueChange) {
      onValueChange(data);
    }
  };

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen}
      size={"md"}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent
        bgColor={"whiteAlpha.400"}
        borderRadius={"3xl"}
        className="px-8 py-4"
        color={"white"}
        backdropFilter={"blur(10px)"}
      >
        <ModalHeader fontSize={"3xl"}>Recipient</ModalHeader>
        <ModalCloseButton
          className="m-6"
          size={"lg"}
          _hover={{
            color: "#6B39AB",
            bgColor: "white",
          }}
          _active={{
            color: "#6B39AB",
            bgColor: "white",
          }}
        />
        <ModalBody>
          <Flex className="flex flex-col justify-between gap-4">
            <Flex className="flex flex-col my-2 items-center">
              <Text className="font-normal leading-5">
                Specify a recipient to receive this transaction amount, the user
                ID is generated by signature which signed authentication message
                by recipient&apos;s EOA on the website. <br />
                Specifying the recipient is an advanced option. entering an
                incorrect user ID will result in asset loss.
              </Text>
              <Card
                className="w-full my-6"
                borderRadius="3xl"
                bgColor={"whiteAlpha.400"}
                border="none"
              >
                <Box className="flex flex-row px-4 py-1 justify-center items-center">
                  <Input
                    type={show ? "text" : "password"}
                    placeholder="Enter recipient's user id"
                    value={userId}
                    onChange={onChange}
                    borderRadius="3xl"
                    border="none"
                    color={"white"}
                    focusBorderColor="transparent"
                    className="placeholder-white/60 font-medium"
                  />
                  <Image
                    boxSize="28px"
                    src={show ? showImage.src : hideImage.src}
                    onClick={handleClick}
                    _hover={{
                      cursor: "pointer",
                    }}
                  />
                </Box>
              </Card>
              <Checkbox
                className="leading-4"
                defaultChecked={isChecked}
                onChange={(e) => {
                  setIsChecked(e.target.checked);
                }}
                colorScheme="red"
                color="rgba(255, 157, 169, 1)"
              >
                I understand that if I enter an invalid user id, the asset will
                never be withdrawn.
              </Checkbox>
            </Flex>
            <Button
              className="w-full py-6"
              borderRadius="full"
              textColor={isChecked ? "black" : "whiteAlpha.400"}
              bgColor={isChecked ? "white" : "whiteAlpha.400"}
              _hover={
                isChecked
                  ? {
                      transform: "scale(1.05)",
                      bgColor: "white",
                      textColor: "#6B39AB",
                    }
                  : {
                      cursor: "not-allowed",
                    }
              }
              _active={
                isChecked
                  ? {
                      transform: "scale(0.95)",
                    }
                  : {
                      cursor: "not-allowed",
                    }
              }
              transitionDuration={"0.2s"}
              onClick={isChecked ? onClose : () => {}}
            >
              Save
            </Button>
          </Flex>
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
