import React from "react";
import { Button } from "@chakra-ui/react";

type Props = {
  colorScheme: string;
  borderRadius?: string;
  children: React.ReactNode;
};

export default function Btn(props: Props) {
  const { colorScheme, borderRadius, children } = props;
  return (
    <Button
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
