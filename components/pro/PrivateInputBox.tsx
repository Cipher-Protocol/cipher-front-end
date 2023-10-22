import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import CipherCard from "../CipherCard";

const nInsNum = [0, 1, 2, 4];

export default function PrivateInputBox() {
  const [nIns, setNIns] = useState(0);
  return (
    <Flex className="flex flex-col w-full ">
      <Flex className="flex justify-center gap-2 my-4">
        {nInsNum.map((num) => (
          <Button
            key={num}
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
            onClick={() => setNIns(num)}
          >
            {num}
          </Button>
        ))}
      </Flex>
      <Flex className="flex w-full mx-auto flex-col items-center gap-2">
        {[...Array(nIns)].map((_, idx) => (
          <CipherCard key={idx} placeholder={`Enter your cipher ${idx + 1}`} />
        ))}
      </Flex>
    </Flex>
  );
}
