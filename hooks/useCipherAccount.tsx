import { useState } from "react";
import { utils } from "ethers";
import { useAccount } from "wagmi";
import { useSignAuth } from "./useSignAuth";
import { cipherSigner } from "../utils/cipherSigner";

export const useCipherAccount = () => {
  const { isConnected } = useAccount();
  const { signTypedDataAsync: signAuth } = useSignAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [cipherAccount, setCipherAccount] = useState<cipherSigner>();

  const authUser = async () => {
    if (isConnected) {
      try {
        const signature = await signAuth();
        const privKey = utils.keccak256(signature).replace("0x", "");
        const privKeyBuf = Buffer.from(privKey, "hex");
        setCipherAccount(new cipherSigner(privKeyBuf));
        setIsAuthenticated(true);
      } catch (error) {
        console.log("error", error);
      }
    }
  };

  const breakAuthUser = () => {
    setCipherAccount(undefined);
    setIsAuthenticated(false);
  };

  return { cipherAccount, isAuthenticated, authUser, breakAuthUser };
};
