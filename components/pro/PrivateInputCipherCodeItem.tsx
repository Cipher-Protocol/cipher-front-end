import { useCipherCodeItem } from "../../hooks/pro";
import CipherCard from "../CipherCard";



type Props = {
  index: number;
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

  return (
    <>
      <p>isLoading={isLoading}, error={error?.message}</p>
      {
        isLoading || (!error && transferableCoin)
        ? <p>valid cipherCode! ({cipherCode?.slice(-5)})</p>
        : <>
          <CipherCard
            value={cipherCode}
            onValueChange={(str) => setCipherCode(str)}
            placeholder={`Enter your cipher ${props.index + 1}`}
          />
          <button
            onClick={() => {
              checkValid();
            }}
          >check</button>
        </>
      }
    </>
  )
}