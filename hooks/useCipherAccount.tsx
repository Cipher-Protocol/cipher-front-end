import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { CipherAccount } from "../type";
const poseidon = require("poseidon-encryption");

export const useCipherAccount = () => {
  const { isConnected } = useAccount();
  const {
    data: signature,
    isSuccess,
    signMessageAsync: signAuthAsync,
  } = useSignMessage({
    message: "Authenticate on Cipher Protocol",
  });
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

  useEffect(() => {
    if (isSuccess && signature) {
      const seed = signature;
      const userId = poseidon.poseidon([seed]).toString();
      setCipherAccount({
        seed: seed,
        userId: userId,
      });
      setIsAuthenticated(true);
    }
  }, [isSuccess]);

  const breakAuthUser = () => {
    setCipherAccount({
      seed: undefined,
      userId: undefined,
    });
    setIsAuthenticated(false);
  };

  return { cipherAccount, isAuthenticated, signAuthAsync, breakAuthUser };
};
