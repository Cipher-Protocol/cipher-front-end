import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Image,
  Flex,
  Skeleton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import React, { useEffect, useState } from "react";
import { TokenConfig } from "../../type";
import SimpleBtn from "../SimpleBtn";
import TokenSelector from "../TokenSelector";
import PublicInputModal from "./PublicInputModal";
import { formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useErc20 } from "../../hooks/useErc20";
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from "../../configs/tokenConfig";

type Props = {
  tokens: TokenConfig[] | undefined;
  selectedToken: TokenConfig;
  isLoadingTokens?: boolean;
  setSelectedToken: React.Dispatch<React.SetStateAction<TokenConfig>>;
  onDownload?: () => void;
  onPrepare?: () => void;
  onSendTransaction?: () => void;
};
export default function SelectBox(props: Props) {
  const {
    tokens,
    selectedToken,
    isLoadingTokens,
    setSelectedToken,
    onPrepare,
  } = props;
  const {
    isOpen: isOpenPublicInModal,
    onOpen: onOpenPublicInModal,
    onClose: onClosePublicInModal,
  } = useDisclosure();

  const { address } = useAccount();
  const { data: ethBalance } = useBalance({
    address: address,
  });
  const [balance, setBalance] = useState<bigint | undefined>(
    ethBalance?.value || 0n
  );
  const { balance: Erc20Balance } = useErc20(selectedToken.address);
  const [pubInAmt, setPubInAmt] = useState<bigint>();

  useEffect(() => {
    if (!address) return;
    if (selectedToken?.address === DEFAULT_NATIVE_TOKEN_ADDRESS) {
      setBalance(ethBalance?.value || 0n);
    } else {
      if (selectedToken === undefined || Erc20Balance === undefined) {
        setBalance(undefined);
      } else {
        setBalance(Erc20Balance);
      }
    }
  }, [ethBalance, Erc20Balance, address, selectedToken]);

  const resetPublicInput = () => {
    setPubInAmt(undefined);
    onOpenPublicInModal();
  };

  return (
    <Flex
      className="w-full py-6 flex flex-row justify-between items-center gap-8 rounded-3xl shadow-md grid-cols-3 px-12"
      bgColor={"whiteAlpha.400"}
      backdropFilter="blur(10px)"
    >
      {/* <SimpleBtn disabled={true} colorScheme="teal" className="w-56">
        Select relayer
      </SimpleBtn> */}
      {/* <SimpleBtn disabled={true} colorScheme="teal" className="w-56">
      Set Recipient
    </SimpleBtn> */}
      {pubInAmt ? (
        <Button
          className="w-full py-6"
          borderRadius="full"
          textColor={"white"}
          bgColor="whiteAlpha.400"
          _hover={{
            bgColor: "whiteAlpha.500",
          }}
          _active={{}}
          onClick={resetPublicInput}
        >
          Deposit: {formatUnits(pubInAmt, selectedToken.decimals)}{" "}
          {selectedToken.symbol}
        </Button>
      ) : (
        <Button
          className="w-full py-6"
          borderRadius="full"
          textColor={"white"}
          bgColor="whiteAlpha.400"
          _hover={{
            transform: "scale(1.05)",
            bgColor: "white",
            textColor: "#6B39AB",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
          transitionDuration={"0.2s"}
          onClick={onOpenPublicInModal}
        >
          Deposit from wallet
        </Button>
      )}
      <TokenSelector
        tokens={tokens}
        selectedToken={selectedToken}
        isLoadingTokens={isLoadingTokens}
        setSelectedToken={setSelectedToken}
      />
      <Button
        className="w-full py-6"
        borderRadius="full"
        textColor={"white"}
        bgColor="whiteAlpha.400"
        _hover={{
          transform: "scale(1.05)",
          bgColor: "white",
          textColor: "#6B39AB",
        }}
        _active={{
          transform: "scale(0.95)",
        }}
        transitionDuration={"0.2s"}
        onClick={() => {
          onPrepare && onPrepare();
        }}
      >
        Prepare Proof
      </Button>
      {/* <SimpleBtn
        colorScheme={"teal"}
        className="w-56"
        onClick={() => {
          onSendTransaction && onSendTransaction();
        }}
      >
        Send transaction
      </SimpleBtn> */}
      <PublicInputModal
        balance={balance}
        selectedToken={selectedToken}
        pubInAmt={pubInAmt}
        setPubInAmt={setPubInAmt}
        isOpen={isOpenPublicInModal}
        onOpen={onOpenPublicInModal}
        onClose={onClosePublicInModal}
      />
    </Flex>
  );
}
