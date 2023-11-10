import { use, useEffect, useMemo, useState } from "react";
import { useCipherCodeItem } from "../../hooks/useCipherCodeItem";
import { CipherTransferableCoin } from "../../lib/cipher/CipherCoin";
import CipherCard from "../shared/CipherCard";
import { Flex, Text } from "@chakra-ui/react";
import { useDebounce, useThrottle } from "@uidotdev/usehooks";
import { formatUnits } from "viem";
import { TokenConfig } from "../../type";

type Props = {
  selectedToken: TokenConfig;
  index: number;
  cipherCode?: string;
  onUpdateCoin?: (coin: CipherTransferableCoin | undefined) => void;
  onUpdateCipherCode?: (cipherCode: string) => void;
};

export default function PrivateInputItem(props: Props) {
  const { selectedToken, index } = props;
  const {
    isLoading,
    cipherCode,
    transferableCoin,
    setCipherCode,
    checkValid,
    error,
  } = useCipherCodeItem({
    selectedTokenAddress: selectedToken.address,
    defaultCipherCode: props.cipherCode,
  });
  const [isValid, setIsValid] = useState<boolean>(true);

  const debouncedCipherCode = useDebounce(cipherCode, 800);

  useEffect(() => {
    if (cipherCode !== props.cipherCode) {
      setCipherCode(props.cipherCode || "");
    }
  }, [props]);

  useEffect(() => {
    if (props.onUpdateCoin) {
      props.onUpdateCoin(transferableCoin);
    }
  }, [transferableCoin]);

  useEffect(() => {
    if (!debouncedCipherCode) return;
    checkValid();
  }, [debouncedCipherCode]);

  useEffect(() => {
    if (!error && transferableCoin) {
      setIsValid(true);
    } else if (!error) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [error, transferableCoin]);

  const handleCipherCodeChange = (str: string) => {
    setCipherCode(str);
    if (props.onUpdateCipherCode) {
      props.onUpdateCipherCode(str);
    }
  };

  // const isValid = useMemo(() => {
  //   return !isLoading && transferableCoin;
  // }, [isLoading, transferableCoin])

  return (
    <>
      <Flex className="flex flex-col w-full">
        <CipherCard
          value={cipherCode}
          onValueChange={(str) => handleCipherCodeChange(str)}
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
          <Flex
            className="flex flex-row justify-between px-8"
            color="whiteAlpha.700"
          >
            <Text>Shield amount:</Text>
            <Text>
              {formatUnits(
                transferableCoin?.coinInfo.amount || 0n,
                selectedToken.decimals
              )}{" "}
              {selectedToken.symbol}
            </Text>
          </Flex>
        ) : (
          <Text className="px-8" color="rgba(255, 157, 169, 1)">
            Invalid cipher code!
          </Text>
        )}
      </Flex>
    </>
  );
}
