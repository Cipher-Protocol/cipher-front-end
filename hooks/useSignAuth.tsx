import { useSignTypedData } from "wagmi";

const domain = {
  name: "",
  version: "1",
  chainId: 1,
  verifyingContract: "0x0000000000000000000000000000000000000000",
} as const;

const types = {
  Main: [
    { name: "Authentication", type: "string" },
    { name: "Action", type: "string" },
  ],
} as const;

const message = {
  Authentication: "",
  Action: "Authenticate",
} as const;

export const useSignAuth = () => {
  const {
    data: signature,
    isError,
    isLoading,
    isSuccess,
    signTypedDataAsync,
  } = useSignTypedData({
    domain: domain,
    types: types,
    message: message,
    primaryType: "Main",
  });
  return { signature, isError, isLoading, isSuccess, signTypedDataAsync };
};
