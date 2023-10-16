import React from "react";
import { Button } from "@chakra-ui/react";

type Props = {
  colorScheme: string;
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export default function SimpleBtn(props: Props) {
  const { colorScheme, children, className, borderRadius, disabled, onClick } =
    props;
  return (
    <Button
      disabled={disabled}
      className={className}
      colorScheme={disabled ? "gray" : colorScheme}
      _hover={
        disabled
          ? { cursor: "not-allowed" }
          : {
              transform: "scale(1.1)",
            }
      }
      _active={
        disabled
          ? { cursor: "not-allowed" }
          : {
              transform: "scale(0.9)",
            }
      }
      transitionDuration={"0.2s"}
      borderRadius={borderRadius || "full"}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </Button>
  );
}
