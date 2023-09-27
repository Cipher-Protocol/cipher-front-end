import React from "react";
import { Button } from "@chakra-ui/react";

type Props = {
  colorScheme: string;
  borderRadius?: string;
  children: React.ReactNode;
  w?: string;
};

export default function Btn(props: Props) {
  const { colorScheme, borderRadius, children, w } = props;
  return (
    <Button
      w={w}
      colorScheme={colorScheme}
      _hover={{
        transform: "scale(1.1)",
      }}
      _active={{
        transform: "scale(0.9)",
      }}
      transitionDuration={"0.2s"}
      borderRadius={borderRadius || "full"}
    >
      {children}
    </Button>
  );
}
