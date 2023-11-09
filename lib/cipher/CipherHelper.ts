import { BigNumber, utils } from "ethers";
import { SNARK_FIELD_SIZE } from "./CipherConfig";
import { PoseidonHash } from "../poseidonHash";
import { assert } from "../helper";
import { CipherTree } from "./CipherTree";
export const FIELD_SIZE_BIGINT = BigInt(SNARK_FIELD_SIZE);

export interface EncodeCipherCodeInterface {
  tokenAddress: string;
  amount: BigNumber | string | bigint;
  salt?: BigNumber | string | bigint;
  random: BigNumber | string | bigint;
  userId?: BigNumber | string | bigint;
}

export interface DecodeCipherCodeResult {
  tokenAddress: string;
  amount: bigint;
  salt?: bigint;
  random: bigint;
  userId?: bigint;
}

export function getUtxoType(nIn: number, mOut: number): string {
  if (isNaN(nIn) || isNaN(mOut)) {
    throw new Error(`Invalid nNum=${nIn}, mNum=${mOut}`);
  }

  if (nIn < 0 || nIn > 255) {
    throw new Error(`Invalid nNum=${nIn}, should be 0 ~ 255`);
  }

  if (mOut < 0 || mOut > 255) {
    throw new Error(`Invalid mNum=${mOut}, should be 0 ~ 255`);
  }

  const nHex = nIn.toString().padStart(2, "0");
  const mHex = mOut.toString().padStart(2, "0");

  const hexCode = `0x${nHex}${mHex}`;
  return hexCode;
}

export function getPublicKey(privateKey: bigint) {
  return PoseidonHash([privateKey]);
}

export function getAmountHash(amount: string): BigNumber {
  return BigNumber.from(
    utils.keccak256(
      utils.defaultAbiCoder.encode(["uint256"], [BigNumber.from(amount)])
    )
  ).mod(BigNumber.from(SNARK_FIELD_SIZE));
}

export function generateCommitment(data: {
  amount: bigint;
  random: bigint;
  salt?: bigint;
  hashedSalt?: bigint;
}) {
  let actualHashedSalt!: bigint;
  if (data.salt) {
    actualHashedSalt = toHashedSalt(data.salt);
  } else if (data.hashedSalt) {
    actualHashedSalt = data.hashedSalt;
  } else {
    throw new Error("hashedSalt or salt at least one should be provided");
  }
  assert(data.amount <= FIELD_SIZE_BIGINT, "amount is too large");
  assert(actualHashedSalt! <= FIELD_SIZE_BIGINT, "hashedSalt is too large");
  assert(data.random <= FIELD_SIZE_BIGINT, "random is too large");

  const commitmentHash = PoseidonHash([
    data.amount,
    actualHashedSalt,
    data.random,
  ]);
  return commitmentHash;
}

export function generateSignature(
  tree: CipherTree,
  indices: bigint,
  commitment: bigint,
  privateKey: bigint
) {
  const signature = PoseidonHash([privateKey, commitment, indices]);
  return signature;
}

export function generateNullifier(
  commitment: bigint,
  indices: bigint,
  inSaltOrSeed: bigint
) {
  const nullifier = PoseidonHash([commitment, indices, inSaltOrSeed]);
  return nullifier;
}

export function indicesToPathIndices(indices: number[]): bigint {
  let binaryString = "0b";
  for (let i = indices.length - 1; i >= 0; i--) {
    binaryString += indices[i] % 2 === 0 ? "0" : "1";
  }
  return BigInt(binaryString);
}

export function toHashedSalt(saltOrSeed: bigint) {
  return PoseidonHash([saltOrSeed]);
}

export function encodeCipherCode(data: EncodeCipherCodeInterface) {
  const cipherCode = utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "uint256", "uint256"],
    [data.tokenAddress, data.amount, data.salt || 0, data.random, data.userId || 0]
  );
  return cipherCode;
}

export function decodeCipherCode(cipherCode: string): DecodeCipherCodeResult {
  try {
    // 0x + 5 * 32 bytes
    if (cipherCode.length !== 2 + 5 * 64) {
      throw new Error("cipher code length invalid");
    }

    const [tokenAddress, amount, saltOrSeed, random, userId] = utils.defaultAbiCoder.decode(
      ["address", "uint256", "uint256", "uint256", "uint256"],
      cipherCode
    ) as [string, BigNumber, BigNumber, BigNumber, BigNumber];

    if (amount.lte(0)) {
      throw new Error("amount invalid");
    }

    if (saltOrSeed.eq(0) && userId.eq(0)) {
      throw new Error("salt and userId must have one");
    }

    if(random.lte(0)) {
      throw new Error("random code invalid");
    }

    return {
      tokenAddress,
      amount: amount.toBigInt(),
      salt: saltOrSeed.isZero() ? undefined : saltOrSeed.toBigInt(),
      random: random.toBigInt(),
      userId: userId.isZero() ? undefined : userId.toBigInt(),
    };
  } catch (e) {
    throw new Error(`Invalid cipherCode`);
  }
}

export function assertCipherCode(cipherResult: DecodeCipherCodeResult, selectedToken: string, userId: bigint) {
  const privateInfoValid = (
    (cipherResult.salt && !cipherResult.userId)
    || (cipherResult.userId && userId !== 0n && userId === cipherResult.userId)
  );

  if(userId === 0n) {
    throw new Error("please connect wallet first");
  }

  if(!privateInfoValid) {
    throw new Error("cipher info invalid");
  }

  if (cipherResult.tokenAddress !== selectedToken) {
    throw new Error("token address invalid");
  }

  return true;
}

export function delay(time: number) {
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve(true);
      }, time);
  });
}
