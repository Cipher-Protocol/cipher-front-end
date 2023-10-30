import { TokenConfig } from "../type";
import { Flex, NumberInput, NumberInputField, Button } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import PublicInput from "./PublicInput";
import { getRandomSnarkField } from "../utils/getRandom";
import { encodeCipherCode, toHashedSalt } from "../lib/cipher/CipherHelper";
import { CipherCoinInfo } from "../lib/cipher/CipherCoin";

type Props = {
  selectedToken: TokenConfig;
  onUpdateCoin?: (coin: CipherCoinInfo | null) => void;

};

const amountTable = [0.01, 0.1, 1, 10];

export default function PrivateOutput(props: Props) {
  const { selectedToken } = props;

  const [cipherCode, setCipherCode] = useState<string>("");
  const [pubInAmt, setPubInAmt] = useState<bigint>(0n);
  const [cipherCoinInfo, setCipherCoinInfo] = useState<CipherCoinInfo>({
    key: {
      hashedSaltOrUserId: 0n,
      inSaltOrSeed: 0n,
      inRandom: 0n,
    },
    amount: 0n,
  });

  useEffect(() => {
    if (props.onUpdateCoin) {
      props.onUpdateCoin(cipherCoinInfo);
    }
  }, [props, cipherCoinInfo]);

  useEffect(() => {
    if (selectedToken === undefined) return;
    const data = {
      tokenAddress: selectedToken.address,
      amount: pubInAmt,
      salt: getRandomSnarkField(),
      random: getRandomSnarkField(),
    };
    const encodedData = encodeCipherCode(data);
    setCipherCode(encodedData);
    const coin: CipherCoinInfo = {
      key: {
        hashedSaltOrUserId: toHashedSalt(data.salt.toBigInt()),
        inSaltOrSeed: data.salt.toBigInt(),
        inRandom: data.random.toBigInt(),
      },
      amount: pubInAmt,
    };
    setCipherCoinInfo(coin);
  }, [pubInAmt, selectedToken]);


  return (
    <Flex className="flex flex-col items-end bg-slate-300 py-2 px-4 rounded-2xl">
      <PublicInput
          pubInAmt={pubInAmt}
          selectedToken={selectedToken}
          setPubInAmt={(amt) => setPubInAmt(amt ? amt as bigint : 0n)}
          balance={0n}
        />
    </Flex>
  );
}
