import { createContext } from "react";
import { useCipherAccount } from "../hooks/useCipherAccount";
import { CipherAccount } from "../type";

export const CipherContext = createContext<{
  cipherAccount: CipherAccount | undefined;
  isAuthenticated: boolean;
  signAuth: () => void;
  breakAuthUser: () => void;
}>({
  cipherAccount: undefined,
  isAuthenticated: false,
  signAuth: () => {},
  breakAuthUser: () => {},
});

export const CipherProvider = ({ children }: { children: React.ReactNode }) => {
  const { cipherAccount, isAuthenticated, signAuth, breakAuthUser } =
    useCipherAccount();

  return (
    <CipherContext.Provider
      value={{ cipherAccount, isAuthenticated, signAuth, breakAuthUser }}
    >
      {children}
    </CipherContext.Provider>
  );
};
