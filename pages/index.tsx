import { useAccount } from "wagmi";
import Header from "../components/Header";
import Pro from "../components/Pro";
import Simple from "../components/Simple";
import { Mode } from "../type.d";
import { Flex } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { CipherAccountContext } from "../providers/CipherProvider";

export default function Page() {
  const [mode, setMode] = useState(Mode.SIMPLE);
  const { isConnected } = useAccount();
  const { isAuthenticated, signAuth, breakAuthUser } =
    useContext(CipherAccountContext);

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      signAuth();
    }
  }, [isConnected, isAuthenticated]);

  return (
    <>
    <Flex className="w-full flex flex-col min-h-screen">
      <Header setMode={setMode} />
      {mode === Mode.SIMPLE ? <Simple /> : <Pro />}
    </Flex>
    </>
  );
}
