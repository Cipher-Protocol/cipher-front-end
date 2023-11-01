import { useEffect, useMemo, useState } from "react";
import { useCipherCodeItem } from "../../hooks/useCipherCodeItem";
import { CipherTransferableCoin } from "../../lib/cipher/CipherCoin";
import CipherCard from "../shared/CipherCard";
import { Flex, Text } from "@chakra-ui/react";

type Props = {
  index: number;
  onUpdateCoin?: (coin: CipherTransferableCoin | undefined) => void;
};

export default function PrivateInputItem(props: Props) {
  const {
    isLoading,
    cipherCode,
    transferableCoin,
    setCipherCode,
    checkValid,
    error,
  } = useCipherCodeItem();
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    if (props.onUpdateCoin) {
      props.onUpdateCoin(transferableCoin);
    }
  }, [props, transferableCoin]);

  // const isValid = useMemo(() => {
  //   return !isLoading && transferableCoin;
  // }, [isLoading, transferableCoin])

  return (
    <>
      {/* <p>
        isLoading={isLoading}, {error ? error.message : ""}
      </p> */}
      {isLoading || (!error && transferableCoin) ? (
        <p>valid cipherCode! ({cipherCode?.slice(-5)})</p>
      ) : (
        <Flex className="flex flex-col w-full">
          <CipherCard
            value={cipherCode}
            onValueChange={(str) => setCipherCode(str)}
            placeholder={`Drag or enter your cipher code`}
          />
          {/* <button
            onClick={() => {
              checkValid();
            }}
          >
            check
          </button> */}
          {isValid ? (
            <></>
          ) : (
            <Text className="px-8" color="rgba(255, 157, 169, 1)">
              Invalid cipher code!
            </Text>
          )}
        </Flex>
      )}
    </>
  );
}
