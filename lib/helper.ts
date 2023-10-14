import { BigNumber } from "ethers";

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
