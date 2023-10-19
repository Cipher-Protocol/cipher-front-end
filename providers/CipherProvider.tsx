import { createContext } from "react";
import { useCipherAccount } from "../hooks/useCipherAccount";
import { CipherAccount } from "../type";

export const CipherAccountContext = createContext<{
  cipherAccount: CipherAccount | undefined;
  isAuthenticated: boolean;
  signAuthAsync: () => Promise<`0x${string}`>;
  breakAuthUser: () => void;
}>({
  cipherAccount: undefined,
  isAuthenticated: false,
  signAuthAsync: () => Promise.resolve(`0x`),
  breakAuthUser: () => {},
});

export const CipherAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { cipherAccount, isAuthenticated, signAuthAsync, breakAuthUser } =
    useCipherAccount();

  return (
    <CipherAccountContext.Provider
      value={{ cipherAccount, isAuthenticated, signAuthAsync, breakAuthUser }}
    >
      {children}
    </CipherAccountContext.Provider>
  );
};
