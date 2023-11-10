import { TokenConfig } from "../../type";
import {
  Flex,
  Text,
  NumberInput,
  NumberInputField,
  Button,
  Image,
  useDisclosure,
  Input,
  Tooltip,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { CipherCoinInfo } from "../../lib/cipher/CipherCoin";
import { getRandomSnarkField } from "../../utils/getRandom";
import { encodeCipherCode, toHashedSalt } from "../../lib/cipher/CipherHelper";
import addUser from "../../assets/images/addUser.png";
import RecipientModal from "./RecipientModal";
import showImage from "../../assets/images/hide1.png";
import hideImage from "../../assets/images/hide2.png";
import { BigNumber } from "ethers";
import { useDebounce } from "@uidotdev/usehooks";

const amountTable = [0.01, 0.1, 1, 10];

type Props = {
  selectedToken: TokenConfig;
  onUpdateCoin?: (coin: CipherCoinInfo | null) => void;
};

export default function PrivateOutputItem(props: Props) {
  const { selectedToken, onUpdateCoin } = props;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cipherCode, setCipherCode] = useState<string>("");
  const [isCustomizedAmt, setIsCustomizedAmt] = useState<boolean>(false);
  const [pubInAmt, setPubInAmt] = useState<bigint>(0n);
  const [numberInputValue, setNumberInputValue] = useState<
    string | undefined
  >();
  const [userId, setUserId] = useState<string>();
  const [show, setShow] = useState(false);
  const [cipherCoinInfo, setCipherCoinInfo] = useState<CipherCoinInfo>({
    key: {
      hashedSaltOrUserId: 0n,
      inSaltOrSeed: 0n,
      inRandom: 0n,
    },
    amount: 0n,
  });
  const debouncedPubInAmt = useDebounce(pubInAmt, 600);

  const handleNumberInputChange = (val: string) => {
    const decimalRegex = new RegExp(
      `^-?\\d+(\\.\\d{0,${selectedToken.decimals}})?$`
    );
    if (decimalRegex.test(val)) {
      setNumberInputValue(val);
      const rawAmount = parseUnits(val, selectedToken.decimals);
      setPubInAmt(rawAmount);
    } else {
      setNumberInputValue("");
      setPubInAmt(0n);
    }
  };

  useEffect(() => {
    if (selectedToken === undefined) return;
    const data = {
      tokenAddress: selectedToken.address,
      amount: debouncedPubInAmt,
      salt: userId ? BigNumber.from(0) : getRandomSnarkField(),
      random: getRandomSnarkField(),
      userId: userId ? BigInt(userId) : BigNumber.from(0),
    };
    const encodedData = encodeCipherCode(data);
    setCipherCode(encodedData);
    const coin: CipherCoinInfo = {
      key: {
        hashedSaltOrUserId: userId
          ? BigInt(userId)
          : toHashedSalt(data.salt.toBigInt()),
        inSaltOrSeed: data.salt.toBigInt(),
        inRandom: data.random.toBigInt(),
      },
      amount: debouncedPubInAmt,
    };
    setCipherCoinInfo(coin);
    if (onUpdateCoin) {
      onUpdateCoin(coin);
    }
  }, [userId, debouncedPubInAmt, selectedToken, onUpdateCoin]);

  const isSelectedBtnActive = (selectedAmt: number) => {
    const rawAmount = parseUnits(
      selectedAmt.toString(),
      selectedToken.decimals
    );
    return rawAmount === pubInAmt ? 1 : 0;
  };

  const handleSelectedAmtBtnClicked = (amt: number) => {
    setNumberInputValue(amt?.toString());
    const rawAmount = parseUnits(amt.toString(), selectedToken.decimals);
    setPubInAmt(rawAmount);
  };

  return (
    <Flex className="flex flex-col w-full">
      <Flex className="flex flex-row items-center w-full">
        <Flex className="gap-2 w-1/2 justify-between">
          {isCustomizedAmt ? (
            <NumberInput
              autoFocus={true}
              variant="outline"
              borderRadius={"full"}
              w={"100%"}
              my={1}
              textColor={"white"}
              _focus={{ borderColor: "white" }}
              focusBorderColor="transparent"
              min={0}
              onChange={(value) => handleNumberInputChange(value)}
              value={numberInputValue}
            >
              <NumberInputField
                placeholder="Deposit Amount"
                borderRadius={"full"}
                bgColor={"whiteAlpha.400"}
                _focus={{ borderColor: "white" }}
                px={6}
                fontSize={"lg"}
              />
            </NumberInput>
          ) : (
            <Flex className="gap-2 my-1 w-full justify-between">
              {amountTable.map((selectedAmt) => (
                <Button
                  key={selectedAmt}
                  borderRadius="3xl"
                  w={"22%"}
                  fontSize={"sm"}
                  _hover={{
                    transform: "scale(1.1)",
                    bgColor: "white",
                    textColor: "brand",
                  }}
                  _active={{
                    transform: "scale(0.9)",
                  }}
                  transitionDuration={"0.2s"}
                  bgColor={
                    isSelectedBtnActive(selectedAmt)
                      ? "white"
                      : "whiteAlpha.400"
                  }
                  textColor={
                    isSelectedBtnActive(selectedAmt) ? "brand" : "white"
                  }
                  onClick={() => handleSelectedAmtBtnClicked(selectedAmt)}
                >
                  {selectedAmt}
                </Button>
              ))}
            </Flex>
          )}
        </Flex>
        <Flex className="w-1/2">
          <Button
            className="w-4/5 mx-2"
            borderRadius={"full"}
            bgColor={"whiteAlpha.400"}
            textColor={"white"}
            _hover={{
              bgColor: "whiteAlpha.500",
            }}
            _active={{
              transform: "scale(0.95)",
            }}
            transitionDuration={"0.2s"}
            onClick={() => setIsCustomizedAmt(!isCustomizedAmt)}
          >
            {isCustomizedAmt ? "Select" : "Customized"}
          </Button>
          <Tooltip
            label="Specify recipient (optional)"
            placement="top"
            bgColor="white"
            textColor="black"
            borderRadius={"md"}
          >
            <Button
              className="w-2/5"
              borderRadius={"full"}
              bgColor={"whiteAlpha.400"}
              _hover={{
                bgColor: "whiteAlpha.500",
              }}
              onClick={onOpen}
            >
              <Image
                w={6}
                src={addUser.src}
                alt="add-user"
                _hover={{
                  transform: "scale(1.1)",
                }}
                _active={{ transform: "scale(0.9)" }}
                transitionDuration={"0.2s"}
              />
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
      <Flex
        className="flex flex-row justify-between px-4"
        color="whiteAlpha.700"
      >
        <Text className="w-full">Specified recipient&apos;s user ID:</Text>
        <Text className="whitespace-nowrap px-2" overflow={"scroll"}>
          {userId ? userId : "None"}
        </Text>
      </Flex>

      <RecipientModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        onValueChange={setUserId}
      />
    </Flex>
  );
}
