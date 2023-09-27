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
        const signature = await signAuth();
        const privKey = utils.keccak256(signature).replace("0x", "");
        const privKeyBuf = Buffer.from(privKey, "hex");
        setxxAccount(new xxSigner(privKeyBuf));
        setIsAuthenticated(true);
      } catch (error) {
        console.log("error", error);
      }
    }
  };

  const breakAuthUser = () => {
    setxxAccount(undefined);
    setIsAuthenticated(false);
  };

  return { xxAccount, isAuthenticated, authUser, breakAuthUser };
};
