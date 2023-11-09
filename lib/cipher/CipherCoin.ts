import { CipherTree } from "./CipherTree";
import { PoseidonHash } from "../../lib/poseidonHash";
import {
  generateCommitment,
  indicesToPathIndices,
  generateNullifier,
  toHashedSalt,
} from "./CipherHelper";
import { assert } from "../helper";

export interface CipherCoinKey {
  inSaltOrSeed?: bigint;
  hashedSaltOrUserId: bigint;
  inRandom: bigint;
}

export interface CipherCoinInfo {
  key: CipherCoinKey;
  amount: bigint;
}

export class CipherBaseCoin {
  coinInfo!: CipherCoinInfo;

  constructor({ key, amount }: CipherCoinInfo) {
    this.coinInfo = {
      key,
      amount,
    };
    if (this.coinInfo.key.inSaltOrSeed) {
      const hashedSaltOrUserId = toHashedSalt(this.coinInfo.key.inSaltOrSeed);
      assert(
        hashedSaltOrUserId === this.coinInfo.key.hashedSaltOrUserId,
        "hashedSaltOrUserId should be equal"
      );
    }
  }

  getCommitment() {
    return generateCommitment({
      amount: this.coinInfo.amount,
      salt: this.coinInfo.key.inSaltOrSeed,
      hashedSalt: this.coinInfo.key.hashedSaltOrUserId,
      random: this.coinInfo.key.inRandom,
    });
  }
}

export class CipherTransferableCoin extends CipherBaseCoin {
  readonly tree!: CipherTree;
  readonly leafId!: number;

  constructor(coinInfo: CipherCoinInfo, tree: CipherTree, leafId: number) {
    super(coinInfo);
    this.tree = tree;
    this.leafId = leafId;
    // TODO: Implement only hashedSaltOrUserId
    assert(this.coinInfo.key.inSaltOrSeed, "privKey should not be null");
  }

  getPathIndices() {
    const { indices } = this.tree.genMerklePath(Number(this.leafId));
    return indicesToPathIndices(indices);
  }

  getPathElements() {
    const { pathElements } = this.tree.genMerklePath(Number(this.leafId));
    assert(
      pathElements.every((v) => v.length === 1),
      "pathElements each length should be 1"
    );
    return pathElements.map((v) => v[0]);
  }

  getNullifier() {
    assert(this.coinInfo.key.inSaltOrSeed, "inSaltOrSeed should not be null");
    const { indices } = this.tree.genMerklePath(this.leafId);
    const pathIndices = indicesToPathIndices(indices);
    const commitment = this.getCommitment();
    return generateNullifier(
      commitment,
      pathIndices,
      this.coinInfo.key.inSaltOrSeed
    );
  }
}

export class CipherOwnershipCoin extends CipherBaseCoin {
  readonly tree!: CipherTree;
  readonly leafId!: number;

  constructor(coinInfo: CipherCoinInfo, tree: CipherTree, leafId: number) {
    super(coinInfo);
    this.tree = tree;
    this.leafId = leafId;
    assert(this.coinInfo.key.hashedSaltOrUserId, "hashedSaltOrUserId should not be null");
  }

  getPathIndices() {
    const { indices } = this.tree.genMerklePath(Number(this.leafId));
    return indicesToPathIndices(indices);
  }

  getPathElements() {
    const { pathElements } = this.tree.genMerklePath(Number(this.leafId));
    assert(
      pathElements.every((v) => v.length === 1),
      "pathElements each length should be 1"
    );
    return pathElements.map((v) => v[0]);
  }
}