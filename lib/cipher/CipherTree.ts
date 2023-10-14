import { PoseidonHash } from "../poseidonHash";
import { IncrementalQuinTree } from "../IncrementalQuinTree";
const LEAVES_PER_NODE = 2;
export class CipherTree extends IncrementalQuinTree {
  tokenAddress!: string;

  constructor(config: {
    depth: number;
    zeroLeaf: string;
    tokenAddress: string;
  }) {
    super(config.depth, BigInt(config.zeroLeaf), LEAVES_PER_NODE, PoseidonHash);
    this.tokenAddress = config.tokenAddress;
  }

  addCommitments(commitments: string[]): void {
    commitments.forEach((commitment) => {
      this.insert(BigInt(commitment));
    });
  }

  getCommitmentByLeafId(leafId: number) {
    return this.getLeaf(leafId);
  }

  findLeafIndexsByCommitment(commitment: bigint): number[] {
    const results: number[] = []
    for(let i = 0; i < this.leaves.length; i++) {
      if(this.getLeaf(i) === commitment) {
        results.push(i);
      }
    }
    return results;
  }
}
// TODO: save coin;
export function initTree({
  tokenAddress,
  depth,
  zeroLeaf,
}: {
  tokenAddress: string;
  depth: number;
  zeroLeaf: string;
}): CipherTree {
  const tree = new CipherTree({
    tokenAddress,
    depth,
    zeroLeaf: zeroLeaf,
  });
  return tree;
}
