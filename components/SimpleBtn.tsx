import React from "react";
import { Button } from "@chakra-ui/react";

type Props = {
  colorScheme: string;
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  onClick?: () => void;
};

export default function SimpleBtn(props: Props) {
  const { colorScheme, children, className, borderRadius, onClick } = props;
  return (
    <Button
      className={className}
      colorScheme={colorScheme}
      _hover={{
        transform: "scale(1.1)",
      }}
      _active={{
        transform: "scale(0.9)",
      }}
      transitionDuration={"0.2s"}
      borderRadius={borderRadius || "full"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
