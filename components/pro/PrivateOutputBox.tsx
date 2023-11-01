import { Button, Flex, Image, useToast } from "@chakra-ui/react";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { TokenConfig } from "../../type";
import { CipherTxProviderContext } from "./ProCipherTxContext";
import { CipherBaseCoin, CipherCoinInfo } from "../../lib/cipher/CipherCoin";
import PrivateOutputItem from "./PrivateOutputItem";
import dropImg from "../../assets/images/drop.png";

const mOutsNum = [0, 1, 2, 4];
const mOutsMax = 4;

interface InputItemInterface {
  coin: CipherCoinInfo | undefined;
  Element: React.JSX.Element;
}

type Props = {
  selectedToken: TokenConfig;
};

export default function PrivateOutputBox(props: Props) {
  const { selectedToken } = props;
  const toast = useToast();
  const [mOuts, setMOuts] = useState(1);
  const { publicOutAmt, totalPrivateOutAmt, setPrivateOutCoins } = useContext(
    CipherTxProviderContext
  );

  const [coinInfoMap, setCoinInfoMap] = useState<
    Map<string, CipherCoinInfo | null>
  >(new Map());

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
        console.log("onUpdateCoin", index, coin);
        setCoinInfoMap((prev) => new Map(prev).set(index.toString(), coin));
      };
      const item: InputItemInterface = {
        coin: undefined,
        Element: (
          <PrivateOutputItem
            key={index}
            selectedToken={selectedToken}
            onUpdateCoin={onUpdateCoin}
          />
        ),
      };
      items.push(item);
    }
    return items;
  }, [mOuts, selectedToken]);

  const handleAddMOut = () => {
    if (mOuts < mOutsMax) {
      setMOuts(mOuts + 1);
    } else {
      toast({
        title: "Over max output",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Flex
      className="flex flex-col w-full rounded-3xl py-6 px-12 h-fit"
      bgColor="whiteAlpha.400"
      backdropFilter="blur(10px)"
    >
      {/* {selectedToken ? (
        <h3 className="text-center">
          TOTAL:{" "}
          {formatUnits(
            publicOutAmt + totalPrivateOutAmt,
            selectedToken.decimals
          )}{" "}
          {selectedToken?.symbol}
        </h3>
      ) : (
        <></>
      )} */}
      {/* <Flex className="flex justify-center gap-2 my-4">
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
      </Flex> */}
      <Flex className="flex w-full mx-auto flex-col items-center gap-2">
        {outCoinInfoItems.map(({ Element }, idx) => (
          <Flex key={idx} className="flex flex-row items-center w-full gap-8">
            {Element}
            <Image
              boxSize={"8"}
              src={dropImg.src}
              alt="drop-image"
              _hover={{
                cursor: "pointer",
                transform: "scale(1.1)",
              }}
              _active={{
                transform: "scale(0.9)",
              }}
              transitionDuration={"0.2s"}
              onClick={() => setMOuts(mOuts - 1)}
            />
          </Flex>
        ))}
        <Button
          className="w-full py-4 mt-4"
          borderRadius="full"
          textColor={"white"}
          bgColor="whiteAlpha.400"
          _hover={{
            bgColor: "whiteAlpha.500",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
          transitionDuration={"0.2s"}
          onClick={handleAddMOut}
        >
          Add +
        </Button>
      </Flex>
    </Flex>
  );
}
