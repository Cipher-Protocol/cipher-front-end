import { Button, Flex } from "@chakra-ui/react";
import React, { useContext, useEffect, useMemo, useState } from "react";
import PrivateOutput from "../PrivateOutput";
import { TokenConfig } from "../../type";
import { CipherTxProviderContext } from "./ProCipherTxContext";
import { CipherBaseCoin, CipherCoinInfo } from "../../lib/cipher/CipherCoin";
import { formatUnits } from "viem";

const mOutsNum = [0, 1, 2, 4];

interface InputItemInterface {
  coin: CipherCoinInfo | undefined;
  Element: React.JSX.Element,
}

type Props = {
  selectedToken: TokenConfig;
};

export default function PrivateOutputBox(props: Props) {
  const { selectedToken } = props;
  const [mOuts, setMOuts] = useState(0);
  const { publicOutAmt, totalPrivateOutAmt, setPrivateOutCoins } = useContext(CipherTxProviderContext);

  const [coinInfoMap, setCoinInfoMap] = useState<Map<string, CipherCoinInfo | null>>(new Map());

  useEffect(() => {
    const coins: Array<CipherCoinInfo | null> = [];
    for (let index = 0; index < mOuts; index++) {
      const coin = coinInfoMap.get(index.toString()) || null;
      coins.push(coin);
    }
    setPrivateOutCoins(coins);
  }, [mOuts, setPrivateOutCoins, coinInfoMap]);


  const outCoinInfoItems = useMemo(() => {
    const items: InputItemInterface[] = [];
    for (let index = 0; index < mOuts; index++) {
      const onUpdateCoin = (coin: CipherCoinInfo | null) => {
        console.log('onUpdateCoin', index, coin);
        setCoinInfoMap((prev) => new Map(prev).set(index.toString(), coin));
      }
      const item: InputItemInterface = {
        coin: undefined,
        Element: <PrivateOutput
          key={index}
          selectedToken={selectedToken}
          onUpdateCoin={onUpdateCoin}
        />
      }
      items.push(item);
    }
    return items;
  }, [mOuts, selectedToken])

  return (
    <Flex className="flex flex-col w-full">
      {
        selectedToken
        ? <h3 className="text-center">TOTAL: {formatUnits(publicOutAmt + totalPrivateOutAmt, selectedToken.decimals)} {selectedToken?.symbol}</h3>
        : <></>
      }
      <Flex className="flex justify-center gap-2 my-4">
        {mOutsNum.map((num) => (
          <Button
            key={num}
            colorScheme="blue"
            borderRadius="md"
            fontSize={"xs"}
            h={"1.2rem"}
            w={"1rem"}
            _hover={{
              transform: "scale(1.1)",
            }}
            _active={{
              transform: "scale(0.9)",
            }}
            transitionDuration={"0.2s"}
            onClick={() => setMOuts(num)}
          >
            {num}
          </Button>
        ))}
      </Flex>
      <Flex className="flex w-full mx-auto flex-col items-center gap-2">
        {outCoinInfoItems.map(({Element}, idx) => (
          <Flex key={idx}>
            {Element}
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}
