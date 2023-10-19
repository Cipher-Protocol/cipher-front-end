import {
  Button,
  Card,
  CardBody,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import React, { ChangeEvent, ChangeEventHandler, useState } from "react";

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
    <Card className="w-[20rem] h-[5rem]">
      <CardBody>
        <InputGroup size="md">
          <Input
            pr="4.5rem"
            type={show ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
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
