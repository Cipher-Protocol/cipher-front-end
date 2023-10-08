import { useAccount } from "wagmi";
import Header from "../components/Header";
import Pro from "../components/Pro";
import Simple from "../components/Simple";
import { useCipherAccount } from "../hooks/useCipherAccount";
import { Mode } from "../type.d";
import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function Page() {
  const [mode, setMode] = useState(Mode.SIMPLE);
  const { isConnected } = useAccount();
  const { isAuthenticated, authUser, breakAuthUser } = useCipherAccount();

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      authUser();
    }
  }, [isConnected, isAuthenticated]);

  return (
    <Flex className="w-full flex flex-col min-h-screen">
      <Header setMode={setMode} />
      {mode === Mode.SIMPLE ? <Simple /> : <Pro />}
    </Flex>
  );
}
