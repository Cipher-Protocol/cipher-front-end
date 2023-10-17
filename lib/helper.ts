import { BigNumber } from "ethers";
const ff = require("ffjavascript");

export const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts;
export const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts;
export const deepCopyBigIntArray = (arr: bigint[]) => {
  return arr.map((x) => BigInt(x.toString()));
};

export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

export function getRawAmountByDecimals(
  amount: string,
  decimals: number
): bigint {
  const base = BigNumber.from(10).pow(decimals);
  return BigNumber.from(amount).mul(base).toBigInt();
}

export function toDecimalStringObject(obj: any): any {
  if (typeof obj === "string") {
    return obj;
  }
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (typeof obj === "number") {
    return obj.toString();
  }
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((v) => toDecimalStringObject(v));
    }
    const tmp: any = {};
    Object.keys(obj).forEach((k) => {
      tmp[k] = toDecimalStringObject(obj[k]);
    });
    return tmp;
  }
  throw new Error(`Unknown type ${typeof obj}`);
}

export function retry<T>(fn: (...args: any) => Promise<T>, retriesLeft: number, interval: number, onError?: (retriesLeft: number, error?: any) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error: any) => {
        if (onError) {
          onError(retriesLeft, error);
        }
        setTimeout(() => {
          if (retriesLeft <= 1) {
            reject(error);
            return;
          }
          retry(fn, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
}
