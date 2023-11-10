import { useAccount } from "wagmi";
import Header from "../components/layout/Header";
import ProContainer from "../components/pro/ProContainer";
import BasicContainer from "../components/basic/BasicContainer";
import { Mode } from "../type.d";
import { Flex, useToast } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { CipherAccountContext } from "../providers/CipherProvider";
import bgImage from "../assets/images/bgImage3.png";

export default function Page() {
  const [mode, setMode] = useState(Mode.SIMPLE);
  const { isConnected } = useAccount();
  const { isAuthenticated, signAuthAsync, breakAuthUser } =
    useContext(CipherAccountContext);
  const toast = useToast();

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      handleSignAuth();
    }
  }, [isConnected, isAuthenticated]);

  const handleSignAuth = async () => {
    try {
      await signAuthAsync();
    } catch (e) {
      toast({
        title: "Sign authentication failed",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <>
      <Flex
        className="w-full flex flex-col h-screen"
        // backgroundImage={`linear-gradient(rgba(134, 50, 240, 0.6), rgba(0, 55, 105, 0)), url(${bgImage.src})`}
        backgroundImage={`url(${bgImage.src})`}
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
      >
        <Header setMode={setMode} />
        {mode === Mode.SIMPLE ? <BasicContainer /> : <ProContainer />}
      </Flex>
    </>
  );
}
