import {
  Button,
  Card,
  CardBody,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import React, { useState } from "react";

type Props = {
  value?: string;
  placeholder?: string;
};

export default function CipherCard(props: Props) {
  const { placeholder, value } = props;
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  return (
    <Card className="w-[20rem] h-[5rem]">
      <CardBody>
        <InputGroup size="md">
          <Input
            pr="4.5rem"
            type={show ? "text" : "password"}
            placeholder={placeholder}
            value={value}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </CardBody>
    </Card>
  );
}
