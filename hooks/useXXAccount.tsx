import { useState } from "react";
import { utils } from "ethers";
import { useAccount } from "wagmi";
import { useSignAuth } from "./useSignAuth";
import { xxSigner } from "@/utils/xxSigner";

export const useXXAccount = () => {
  const { isConnected } = useAccount();
  const { signTypedDataAsync: signAuth } = useSignAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [xxAccount, setxxAccount] = useState<xxSigner>();

  const authUser = async () => {
    if (isConnected) {
      try {
        const sig = await signAuth();
        if (sig) {
          authenticate(sig);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  };

  const authenticate = (signature: string) => {
    if (signature) {
      const privKeyBuf = Buffer.from(
        utils.keccak256(signature).replace("0x", ""),
        "hex"
      );
      setxxAccount(new xxSigner(privKeyBuf));
    }
  };

  const breakAuthUser = () => {
    setxxAccount(undefined);
    setIsAuthenticated(false);
  };

  return { xxAccount, isAuthenticated, authUser, breakAuthUser };
};
