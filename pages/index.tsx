import Header from "@/components/header";
import ModeTab from "@/components/modeTab";
import Pro from "@/components/pro";
import Simple from "@/components/simple";
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
