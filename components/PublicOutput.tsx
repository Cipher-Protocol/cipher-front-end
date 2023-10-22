import { Flex, NumberInput, NumberInputField, Button } from "@chakra-ui/react";
import React from "react";

const amountTable = [0.01, 0.1, 1, 10];

export default function PublicOutput() {
  return (
    <Flex className="flex flex-col items-end py-2 px-4 ">
      <Flex className="gap-2 my-1">
        {amountTable.map((amt) => (
          <Button
            key={amt}
            colorScheme="blue"
            borderRadius="md"
            fontSize={"xs"}
            h={"1.2rem"}
            w={"1rem"}
            _hover={{
              transform: "scale(1.1)",
            }}
            _active={{
              transform: "scale(0.9)",
            }}
            transitionDuration={"0.2s"}
          >
            {amt}
          </Button>
        ))}
      </Flex>
      <NumberInput variant="outline" min={0}>
        <NumberInputField placeholder="Deposit Amount" borderRadius={"full"} />
      </NumberInput>
    </Flex>
  );
}
