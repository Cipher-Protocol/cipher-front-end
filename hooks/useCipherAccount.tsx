import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useSignAuth } from "./useSignAuth";
import { CipherAccount } from "../type";
import { useQuery } from "@tanstack/react-query";
const poseidon = require("poseidon-encryption");

export const useCipherAccount = () => {
  const { isConnected } = useAccount();
  const { signTypedDataAsync: signAuth } = useSignAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [cipherAccount, setCipherAccount] = useState<CipherAccount>({
    seed: undefined,
    userId: undefined,
  });

  useEffect(() => {
    if (!isConnected) {
      breakAuthUser();
    }
  }, [isConnected]);

  const authUser = async () => {
    if (isConnected) {
      try {
        const signature = await signAuth();
        const seed = signature.toString();
        const userId = poseidon.poseidon([seed]).toString();
        setCipherAccount({
          seed: seed,
          userId: userId,
        });
        setIsAuthenticated(true);
        console.log("isAuthenticated", isAuthenticated);
      } catch (error) {
        console.log("error", error);
      }
    }
  };

  const breakAuthUser = () => {
    setCipherAccount({
      seed: undefined,
      userId: undefined,
    });
    setIsAuthenticated(false);
  };

  return { cipherAccount, isAuthenticated, authUser, breakAuthUser };
};
