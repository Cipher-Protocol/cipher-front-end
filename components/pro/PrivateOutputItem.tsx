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
  const [isCustomAmt, setIsCustomAmt] = useState<boolean>(false);
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
    <Flex key={pubInAmt} className="flex flex-row items-center w-full">
      <Flex className="gap-2 w-1/2 justify-between">
        {isCustomAmt ? (
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
          className="w-1/2 mx-2"
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
          onClick={() => setIsCustomAmt(!isCustomAmt)}
        >
          {isCustomAmt ? "Select" : "Custom"}
        </Button>
        {userId ? (
          <Button
            className="w-1/2"
            borderRadius={"full"}
            bgColor={"whiteAlpha.400"}
            _hover={{
              bgColor: "whiteAlpha.500",
            }}
          >
            <Input
              type={show ? "text" : "password"}
              placeholder="Enter recipient's user id"
              value={userId}
              borderRadius="3xl"
              border="none"
              color={"white"}
              focusBorderColor="transparent"
              bgColor={"transparent"}
              className="font-medium"
            />
            <Image
              boxSize="20px"
              src={show ? showImage.src : hideImage.src}
              onClick={handleClick}
              _hover={{
                cursor: "pointer",
              }}
            />
          </Button>
        ) : (
          <Button
            className="w-1/2"
            borderRadius={"full"}
            bgColor={"whiteAlpha.400"}
            _hover={{
              bgColor: "whiteAlpha.500",
            }}
            onClick={onOpen}
          >
            <Image
              w={8}
              src={addUser.src}
              alt="add-user"
              _hover={{
                transform: "scale(1.1)",
              }}
              _active={{ transform: "scale(0.9)" }}
              transitionDuration={"0.2s"}
            />
          </Button>
        )}
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
