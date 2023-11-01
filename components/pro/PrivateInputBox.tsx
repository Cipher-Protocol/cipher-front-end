import { Button, Flex, Image, useToast } from "@chakra-ui/react";
import React, { useContext, useEffect, useMemo, useState } from "react";
import CipherCard from "../shared/CipherCard";
import PrivateInputCipherCodeItem from "./PrivateInputItem";
import { CipherTransferableCoin } from "../../lib/cipher/CipherCoin";
import { CipherTxProviderContext } from "./ProCipherTxContext";
import { TokenConfig } from "../../type";
import { formatUnits } from "viem";
import dropImg from "../../assets/images/drop.png";

const nInsNum = [0, 1, 2, 4];
const nInsMax = 4;

interface InputItemInterface {
  coin: CipherTransferableCoin | undefined;
  Element: React.JSX.Element;
}

type Props = {
  selectedToken: TokenConfig;
};

export default function PrivateInputBox({ selectedToken }: Props) {
  const toast = useToast();
  const [nIns, setNIns] = useState(1);
  const { publicInAmt, totalPrivateInAmt, setPrivateInCoins } = useContext(
    CipherTxProviderContext
  );
  const [transferableCoinMap, setTransferableCoinMap] = useState<
    Map<string, CipherTransferableCoin | undefined>
  >(new Map());

  const handleAddNIns = () => {
    if (nIns < nInsMax) {
      setNIns(nIns + 1);
    } else {
      toast({
        title: "Over max input cipher code",
        description: "",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  useEffect(() => {
    const coins: Array<CipherTransferableCoin | null> = [];
    for (let index = 0; index < nIns; index++) {
      const coin = transferableCoinMap.get(index.toString());
      coins.push(coin || null);
    }
    setPrivateInCoins(coins);
  }, [nIns, setPrivateInCoins, transferableCoinMap]);

  const inputCoinItems = useMemo(() => {
    const items: InputItemInterface[] = [];
    for (let index = 0; index < nIns; index++) {
      const onUpdateCoin = (coin: CipherTransferableCoin | undefined) => {
        console.log("onUpdateCoin", index, coin);
        setTransferableCoinMap((prev) =>
          new Map(prev).set(index.toString(), coin)
        );
      };
      const item: InputItemInterface = {
        coin: undefined,
        Element: (
          <PrivateInputCipherCodeItem
            key={index}
            index={index}
            onUpdateCoin={onUpdateCoin}
          ></PrivateInputCipherCodeItem>
        ),
      };
      items.push(item);
    }
    return items;
  }, [nIns]);

  return (
    <Flex
      className="flex flex-col w-full rounded-3xl py-6 px-12 h-fit"
      bgColor="whiteAlpha.400"
      backdropFilter="blur(10px)"
    >
      {/* {selectedToken ? (
        <h3 className="text-center">
          TOTAL:{" "}
          {formatUnits(publicInAmt + totalPrivateInAmt, selectedToken.decimals)}{" "}
          {selectedToken?.symbol}
        </h3>
      ) : (
        <></>
      )} */}
      {/* <Flex className="flex justify-center gap-2 my-4">
        {nInsNum.map((num) => (
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
            onClick={() => setNIns(num)}
          >
            {num}
          </Button>
        ))}
      </Flex> */}
      <Flex className="flex w-full mx-auto flex-col items-center gap-2">
        {inputCoinItems.map(({ Element }, idx) => (
          <Flex className="flex flex-row items-start w-full gap-8" key={idx}>
            {Element}
            <Image
              className="my-2"
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
              onClick={() => setNIns(nIns - 1)}
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
          onClick={handleAddNIns}
        >
          Add +
        </Button>
      </Flex>
    </Flex>
  );
}
