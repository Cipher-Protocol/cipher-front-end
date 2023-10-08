import { useState } from "react";
import { useAccount } from "wagmi";
import { useSignAuth } from "./useSignAuth";
import { CipherAccount } from "../type";
const poseidon = require("poseidon-encryption");

export const useCipherAccount = () => {
  const { isConnected } = useAccount();
  const { signTypedDataAsync: signAuth } = useSignAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [cipherAccount, setCipherAccount] = useState<CipherAccount>();

  const authUser = async () => {
    if (isConnected) {
      try {
        const seed = await signAuth();
        const userId = poseidon.poseidon(seed).toString();
        setCipherAccount({
          seed: seed,
          userId: userId,
        });
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
