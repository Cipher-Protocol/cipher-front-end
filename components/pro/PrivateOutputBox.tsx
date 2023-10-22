import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import PrivateOutput from "../PrivateOutput";
import { TokenConfig } from "../../type";

const mOutsNum = [0, 1, 2, 4];

type Props = {
  selectedToken: TokenConfig;
};

export default function PrivateOutputBox(props: Props) {
  const { selectedToken } = props;
  const [mOuts, setMOuts] = useState(0);

  return (
    <Flex className="flex flex-col w-full">
      <Flex className="flex justify-center gap-2 my-4">
        {mOutsNum.map((num) => (
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
            onClick={() => setMOuts(num)}
          >
            {num}
          </Button>
        ))}
      </Flex>
      <Flex className="flex w-full mx-auto flex-col items-center gap-2">
        {[...Array(mOuts)].map((_, idx) => (
          <PrivateOutput key={idx} selectedToken={selectedToken} />
        ))}
      </Flex>
    </Flex>
  );
}
