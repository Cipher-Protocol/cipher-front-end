import { useEffect, useState } from "react";
import { useCipherCodeItem } from "../../hooks/useCipherCodeItem";
import { CipherTransferableCoin } from "../../lib/cipher/CipherCoin";
import CipherCard from "../CipherCard";

type Props = {
  index: number;
  onUpdateCoin?: (coin: CipherTransferableCoin | undefined) => void;
};

export default function PrivateInputCipherCodeItem(props: Props) {
  const {
    isLoading,
    cipherCode,
    transferableCoin,
    setCipherCode,
    checkValid,
    error,
  } = useCipherCodeItem();

  useEffect(() => {
    if (props.onUpdateCoin) {
      props.onUpdateCoin(transferableCoin);
    }
  }, [props, transferableCoin]);

  return (
    <>
      <p>
        isLoading={isLoading}, {error ? error.message : ""}
      </p>
      {isLoading || (!error && transferableCoin) ? (
        <p>valid cipherCode! ({cipherCode?.slice(-5)})</p>
      ) : (
        <>
          <CipherCard
            value={cipherCode}
            onValueChange={(str) => setCipherCode(str)}
            placeholder={`Enter your cipher ${props.index + 1}`}
          />
          <button
            onClick={() => {
              checkValid();
            }}
          >
            check
          </button>
        </>
      )}
    </>
  );
}
