import { createContext } from "react";
import { useCipherAccount } from "../hooks/useCipherAccount";
import { CipherAccount } from "../type";

export const CipherContext = createContext<{
  cipherAccount: CipherAccount | undefined;
  isAuthenticated: boolean;
  authUser: () => void;
  breakAuthUser: () => void;
}>({
  cipherAccount: undefined,
  isAuthenticated: false,
  authUser: () => {},
  breakAuthUser: () => {},
});

export const CipherProvider = ({ children }: { children: React.ReactNode }) => {
  const { cipherAccount, isAuthenticated, authUser, breakAuthUser } =
    useCipherAccount();

  return (
    <CipherContext.Provider
      value={{ cipherAccount, isAuthenticated, authUser, breakAuthUser }}
    >
      {children}
    </CipherContext.Provider>
  );
};
