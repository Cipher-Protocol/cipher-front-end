import { BigNumber, utils } from "ethers";
import { SNARK_FIELD_SIZE } from "./CipherConfig";
import { PoseidonHash } from "../poseidonHash";
import { assert } from "../helper";
import { CipherTree } from "./CipherTree";
export const FIELD_SIZE_BIGINT = BigInt(SNARK_FIELD_SIZE);

export function getDefaultLeaf(tokenAddress: string) {
  const hash = BigInt(
    utils.keccak256(utils.defaultAbiCoder.encode(["address"], [tokenAddress]))
  );
  return hash % FIELD_SIZE_BIGINT;
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
  amount: bigint,
  random: bigint,
  salt?: bigint,
  hashedSalt?: bigint,
}) {
  if(!data.hashedSalt || !data.salt) {
    throw new Error('hashedSalt or salt at least one should be provided');
  }
  const actualHashedSalt = data.salt ? toHashedSalt(data.salt) : data.hashedSalt;
  assert(data.amount <= FIELD_SIZE_BIGINT, "amount is too large");
  assert(actualHashedSalt <= FIELD_SIZE_BIGINT, "hashedSalt is too large");
  assert(data.random <= FIELD_SIZE_BIGINT, "random is too large");

  const commitmentHash = PoseidonHash([data.amount, data.hashedSalt, data.random]);
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
  signature: bigint
) {
  const nullifier = PoseidonHash([commitment, indices, signature]);
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

export function encodeCipherCode(data: {
  tokenAddress: string;
  amount: BigNumber | string | bigint;
  salt: BigNumber | string | bigint;
  random: BigNumber | string | bigint;
  // leafIndex: BigNumber | string | bigint;
}) {
  const cipherCode = utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "uint256"],
    [data.tokenAddress, data.amount, data.salt, data.random]
  );
  console.log('decodeCipherCode', {
    cipherCode,
    ...data,
  })
  return cipherCode;
}

export function decodeCipherCode(cipherCode: string): {
  tokenAddress: string;
  amount: BigNumber;
  salt: BigNumber;
  random: BigNumber;
} {
  const [
    tokenAddress,
    amount,
    salt,
    random,
    leafIndex,
  ] = utils.defaultAbiCoder.decode(
    ["address", "uint256", "uint256", "uint256"],
    cipherCode
  );
  console.log('decodeCipherCode', {
    cipherCode,
    tokenAddress,
    amount,
    salt,
    random,
    leafIndex,
  })
  return {
    tokenAddress,
    amount,
    salt,
    random,
  };
}