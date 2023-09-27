import Header from "@/components/Header";
import ModeTab from "@/components/ModeTab";
import Pro from "@/components/Pro";
import Simple from "@/components/Simple";
import { Mode } from "@/type";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";

export default function Page() {
  const [mode, setMode] = useState(Mode.SIMPLE);

  return (
    <Flex w="full" minHeight="100vh" flexDirection={"column"}>
      <Header />
      <ModeTab setMode={setMode} />
      {mode === Mode.SIMPLE ? <Simple /> : <Pro />}
    </Flex>
  );
}
