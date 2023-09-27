import Header from "@/components/Header";
import ModeTab from "@/components/ModeTab";
import Pro from "@/components/Pro";
import Simple from "@/components/Simple";
import { useXXAccount } from "@/hooks/useXXAccount";
import { Mode } from "@/type.d";
import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function Page() {
  const [mode, setMode] = useState(Mode.SIMPLE);
  const { xxAccount, isAuthenticated, authUser, breakAuthUser } =
    useXXAccount();

  // console.log("isAuthenticated", isAuthenticated);
  console.log("xxAccount", xxAccount?.pubKey);

  useEffect(() => {
    if (!isAuthenticated) {
      authUser();
    }
  }, [isAuthenticated]);

  return (
    <Flex w="full" minHeight="100vh" flexDirection={"column"}>
      <Header />
      <ModeTab setMode={setMode} />
      {mode === Mode.SIMPLE ? <Simple /> : <Pro />}
    </Flex>
  );
}
