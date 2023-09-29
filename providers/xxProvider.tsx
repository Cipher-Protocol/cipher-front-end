import { createContext } from "react";
import { useXXAccount } from "../hooks/useXXAccount";
import { xxSigner } from "../utils/xxSigner";

export const XxContext = createContext<{
  xxAccount: xxSigner | undefined;
  isAuthenticated: boolean;
  authUser: () => void;
  breakAuthUser: () => void;
}>({
  xxAccount: undefined,
  isAuthenticated: false,
  authUser: () => {},
  breakAuthUser: () => {},
});

export const XxProvider = ({ children }: { children: React.ReactNode }) => {
  const { xxAccount, isAuthenticated, authUser, breakAuthUser } =
    useXXAccount();

  return (
    <XxContext.Provider
      value={{ xxAccount, isAuthenticated, authUser, breakAuthUser }}
    >
      {children}
    </XxContext.Provider>
  );
};
