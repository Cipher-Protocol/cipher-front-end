const circomlibjs = require("circomlibjs");
type PoseidonFunction = (x: bigint[]) => bigint;
export let _PoseidonHash!: PoseidonFunction;
const _asyncPoseidon = circomlibjs.buildPoseidon();

export const asyncPoseidonHash = new Promise<PoseidonFunction>(
  // eslint-disable-next-line no-async-promise-executor
  async (resolve, reject) => {
    try {
      const p = await _asyncPoseidon;
      resolve((x: bigint[]) => p.F.toObject(p(x)));
    } catch (error) {
      reject(error);
    }
  }
);
(async function () {
  _PoseidonHash = await asyncPoseidonHash;
})();

class dpPoseidonCache {
  static cache = new Map<string, bigint>();

  static getCache(x: bigint[]): undefined | bigint {
    const key = x.join(",");
    return dpPoseidonCache.cache.get(key);
  }

  static setCache(x: bigint[], v: bigint) {
    const key = x.join(",");
    dpPoseidonCache.cache.set(key, v);
  }
}

export function PoseidonHash(inputs: bigint[], isDpEnabled = false): bigint {
  if (isDpEnabled) {
    const cache = dpPoseidonCache.getCache(inputs);
    if (cache) {
      return cache;
    }
  }

  const res = _PoseidonHash(inputs);

  if (isDpEnabled) {
    dpPoseidonCache.setCache(inputs, res);
  }
  return res;
}
