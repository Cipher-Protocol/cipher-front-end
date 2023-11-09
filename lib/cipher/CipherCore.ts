import {
  CipherCoinInfo,
  CipherTransferableCoin,
  CipherBaseCoin,
  CipherOwnershipCoin,
} from "./CipherCoin";
import { PoseidonHash } from "../poseidonHash";
import {
  PublicInfoStruct,
  ProofStruct,
} from "./types/CipherContract.type";
import { utils, BigNumber } from "ethers";
import { CipherTree } from "./CipherTree";
import { prove } from "../prove";
import { assert } from "../helper";
import { FIELD_SIZE_BIGINT } from "./CipherHelper";
export const ethTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/** Methods */
export function getCoinInfoFromAmt(
  amt: bigint,
  {
    inRandom,
    inSaltOrSeed,
  }: {
    inRandom: bigint;
    inSaltOrSeed: bigint;
  }
) {
  const coinInfo: CipherCoinInfo = {
    key: {
      inSaltOrSeed,
      hashedSaltOrUserId: PoseidonHash([inSaltOrSeed]),
      inRandom,
    },
    amount: amt,
  };
  return coinInfo;
}

export function createCoin(
  tree: CipherTree,
  {
    amount,
    inRandom,
    inSaltOrSeed,
  }: {
    amount: bigint;
    inRandom: bigint;
    inSaltOrSeed: bigint;
  }
) {
  const coinInfo = getCoinInfoFromAmt(amount, {
    inRandom,
    inSaltOrSeed,
  });
  const leafId = tree.nextIndex;
  return new CipherTransferableCoin(coinInfo, tree, leafId);
}

export interface CipherTxRequest {
  publicInAmt: bigint;
  publicOutAmt: bigint;
  privateInCoins: CipherTransferableCoin[];
  privateOutCoins: CipherBaseCoin[];
}

export async function prepareCipherTx(
  {
    publicInAmt,
    publicOutAmt,
    privateInCoins,
    privateOutCoins,
  }: CipherTxRequest,
  publicInfo: PublicInfoStruct
) {}

// TODO: parameters: publicInfo
export async function generateCipherTx(
  tree: CipherTree,
  {
    publicInAmt,
    publicOutAmt,
    privateInCoins,
    privateOutCoins,
  }: CipherTxRequest,
  publicInfo: PublicInfoStruct
) {
  const transferableCoins: CipherOwnershipCoin[] = [];
  const newTree = tree.copyCipherTree();
  const currentRoot = newTree.root;

  const totalPrivateInAmount = privateInCoins.reduce(
    (acc, coin) => acc + coin.coinInfo.amount,
    0n
  );
  const totalPrivateOutAmount = privateOutCoins.reduce(
    (acc, coin) => acc + coin.coinInfo.amount,
    0n
  );
  assert(
    publicInAmt + totalPrivateInAmount === publicOutAmt + totalPrivateOutAmount,
    "inAmounts and outAmounts are not balanced"
  );

  const privateInputLength = privateInCoins.length;
  const privateOutputLength = privateOutCoins.length;

  for (let i = 0; i < privateInputLength; i++) {
    const ins = privateInCoins[i];
    const inSaltOrSeed = ins.coinInfo.key.inSaltOrSeed as bigint;
    const hashedSaltOrUserId = PoseidonHash([inSaltOrSeed]);
    const commitment = PoseidonHash([
      ins.coinInfo.amount,
      hashedSaltOrUserId,
      ins.coinInfo.key.inRandom,
    ]);
    assert(
      commitment === newTree.getCommitmentByLeafId(ins.leafId),
      "privateInCoins commitment is not in the tree"
    );
  }

  const circuitUtxoInput = {
    // Coin Inputs
    inputNullifier: privateInCoins.map((coin) => coin.getNullifier()),
    inAmount: privateInCoins.map((coin) => coin.coinInfo.amount),
    inSaltOrSeed: privateInCoins.map((coin) => coin.coinInfo.key.inSaltOrSeed),
    inRandom: privateInCoins.map((coin) => coin.coinInfo.key.inRandom),
    inPathIndices: privateInCoins.map((coin) => coin.getPathIndices()),
    inPathElements: privateInCoins.map((coin) => coin.getPathElements()),
  };

  for (let index = 0; index < privateOutputLength; index++) {
    const coin = privateOutCoins[index];
    assert(coin.coinInfo.key.inRandom, "inRandom should not be null");
    assert(coin.coinInfo.key.hashedSaltOrUserId, "hashedSaltOrUserId should not be null");
    const leafId = newTree.nextIndex;
    const payableCoin = new CipherOwnershipCoin({
      amount: coin.coinInfo.amount,
      key: {
        inSaltOrSeed: coin.coinInfo.key.inSaltOrSeed,
        hashedSaltOrUserId: coin.coinInfo.key.hashedSaltOrUserId,
        inRandom: coin.coinInfo.key.inRandom,
      }
    }, newTree, leafId);
    newTree.insert(payableCoin.getCommitment());
    transferableCoins.push(payableCoin);
  }
  const circuitUtxoOutput = {
    // Coin Outputs
    outputCommitment: transferableCoins.map((coin) => coin.getCommitment()),
    outAmount: transferableCoins.map((coin) => coin.coinInfo.amount),
    outHashedSaltOrUserId: transferableCoins.map(
      (coin) => coin.coinInfo.key.hashedSaltOrUserId
    ),
    outRandom: transferableCoins.map((coin) => coin.coinInfo.key.inRandom),
  };
  /** Circuit input */
  const publicInfoHash = toPublicInfoHash(publicInfo);
  const circuitInput = {
    root: currentRoot,
    publicInAmt,
    publicOutAmt,
    publicInfoHash: BigInt(publicInfoHash),
    ...circuitUtxoInput,
    ...circuitUtxoOutput,
  };

  /** Prove */
  const heightName = `h${newTree.depth}`;
  const specName = `n${privateInputLength}m${privateOutputLength}`;
  
  const {calldata} = await prove(circuitInput, {
    heightName,
    specName,
  })

  /** Contract calldata */
  const utxoData: ProofStruct = {
    a: calldata[0],
    b: calldata[1],
    c: calldata[2],
    publicSignals: {
      root: utils.hexlify(currentRoot),
      publicInAmt: publicInAmt.toString(),
      publicOutAmt: publicOutAmt.toString(),
      publicInfoHash,
      inputNullifiers: privateInCoins.map((coin) =>
        utils.hexlify(coin.getNullifier())
      ),
      outputCommitments: transferableCoins.map((coin) =>
        utils.hexlify(coin.getCommitment())
      ),
    },
  };

  return {
    tree: newTree,
    privateInputLength,
    privateOutputLength,
    transferableCoins,
    circuitInput,
    currentRoot,
    newRoot: newTree.root,
    contractCalldata: {
      utxoData,
      publicInfo,
    },
  };
}

function toPublicInfoHash(publicInfo: PublicInfoStruct) {
  const data = utils.defaultAbiCoder.encode(
    ["uint16", "address", "address", "uint32"],
    [
      publicInfo.maxAllowableFeeRate,
      publicInfo.recipient,
      publicInfo.token,
      publicInfo.deadline,
    ]
  );
  return utils.hexlify(
    BigNumber.from(utils.keccak256(data)).mod(FIELD_SIZE_BIGINT)
  );
}
