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
import React, { useCallback, useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { CipherCoinInfo } from "../../lib/cipher/CipherCoin";
import { getRandomSnarkField } from "../../utils/getRandom";
import { encodeCipherCode, toHashedSalt } from "../../lib/cipher/CipherHelper";
import addUser from "../../assets/images/addUser.png";
import RecipientModal from "./RecipientModal";
import showImage from "../../assets/images/hide1.png";
import hideImage from "../../assets/images/hide2.png";

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
  const [selectedAmt, setSelectedAmt] = useState<number>();
  const [userId, setUserId] = useState<string>();
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  const [cipherCoinInfo, setCipherCoinInfo] = useState<CipherCoinInfo>({
    key: {
      hashedSaltOrUserId: 0n,
      inSaltOrSeed: 0n,
      inRandom: 0n,
    },
    amount: 0n,
  });

  const handlePubInAmt = (amt: number) => {
    setPubInAmt(parseUnits(amt.toString(), selectedToken.decimals));
  };

  useEffect(() => {
    if (pubInAmt !== undefined) return;
    setSelectedAmt(undefined);
  }, [pubInAmt]);

  useEffect(() => {
    if (onUpdateCoin) {
      onUpdateCoin(cipherCoinInfo);
    }
  }, [onUpdateCoin, cipherCoinInfo]);

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
        hashedSaltOrUserId: userId
          ? BigInt(userId)
          : toHashedSalt(data.salt.toBigInt()),
        inSaltOrSeed: data.salt.toBigInt(),
        inRandom: data.random.toBigInt(),
      },
      amount: pubInAmt,
    };
    setCipherCoinInfo(coin);
  }, [userId, pubInAmt, selectedToken]);

  const renderAmtBtns = useCallback(() => {
    return (
      <Flex className="gap-2 my-1 w-full justify-between">
        {amountTable.map((amt) => (
          <Button
            key={amt}
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
            bgColor={selectedAmt === amt ? "white" : "whiteAlpha.400"}
            textColor={selectedAmt === amt ? "brand" : "white"}
            onClick={() => {
              handlePubInAmt(amt);
              setSelectedAmt(amt);
            }}
          >
            {amt}
          </Button>
        ))}
      </Flex>
    );
  }, [selectedAmt]);

  return (
    <Flex className="flex flex-col w-full">
      <Flex key={pubInAmt} className="flex flex-row items-center w-full">
        <Flex className="gap-2 w-1/2 justify-between">
          {isCustomizedAmt ? (
            <NumberInput
              variant="outline"
              borderRadius={"full"}
              w={"100%"}
              my={1}
              textColor={"white"}
              _focus={{ borderColor: "white" }}
              focusBorderColor="transparent"
              min={0}
              onChange={(value) => handlePubInAmt(Number(value))}
              value={
                pubInAmt
                  ? Number(formatUnits(pubInAmt, selectedToken?.decimals))
                  : 0
              }
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
            renderAmtBtns()
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
        color="whiteAlpha.600"
      >
        <Text className="w-full">Specified recipient's user ID:</Text>
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
