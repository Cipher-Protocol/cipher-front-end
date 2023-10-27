import {
  Button,
  Card,
  CardBody,
  Input,
  InputGroup,
  InputRightElement,
  Image,
  Box,
} from "@chakra-ui/react";
import React, { ChangeEvent, ChangeEventHandler, useState } from "react";
import hideImage from "../assets/images/hide.png";

type Props = {
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
};

export default function CipherCard(props: Props) {
  const { placeholder, value, onValueChange } = props;
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  const onChange: ChangeEventHandler = (event: ChangeEvent) => {
    const ele = event.target as HTMLInputElement;
    const data = ele.value;
    if (value === data) return;
    if (onValueChange) {
      onValueChange(data);
    }
  };

  return (
    <Card
      className="w-[20rem]"
      borderRadius="3xl"
      bgColor={"whiteAlpha.400"}
      border="none"
    >
      <Box className="flex flex-row px-4 py-1 justify-center items-center">
        <Input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          borderRadius="3xl"
          border="none"
          color={"white"}
          focusBorderColor="transparent"
          className="placeholder-white"
        />
        <Image
          boxSize="28px"
          src={hideImage.src}
          onClick={handleClick}
          _hover={{
            cursor: "pointer",
          }}
        />
      </Box>
    </Card>
  );
}
