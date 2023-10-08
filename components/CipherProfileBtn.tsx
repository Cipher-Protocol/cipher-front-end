import React from "react";
import { Image } from "@chakra-ui/react";
import mockIcon from "../assets/icon/eth.png";

export default function CipherProfileBtn() {
  return (
    <>
      <Image
        className="rounded-full"
        boxSize="30px"
        src={mockIcon.src}
        alt=""
        _hover={{ cursor: "pointer", opacity: 0.8, transform: "scale(1.1)" }}
        _active={{ transform: "scale(0.9)" }}
        transitionDuration={"0.2s"}
      />
    </>
  );
}
