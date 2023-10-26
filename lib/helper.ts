import { BigNumber } from "ethers";
import { debounce, memoize, throttle } from "lodash";
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


/**  memoizeDebounce */
export interface memoizeDebounceOptions {
  resolver?: (...args: any[]) => any;
  leading?: boolean;
  trailing?: boolean;
}

export function memoizeDebounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number = 0, 
  options: memoizeDebounceOptions = {}
): T {
  const mem = memoize(function() {
    return debounce(func, wait, {
      leading: options.leading,
      trailing: options.trailing
    });
  }, options.resolver);

  return function(this: ThisType<any>, ...args: any[]): any {
    return mem.apply(this, args as []).apply(this, args as Parameters<T>);
  } as T;
}


export interface memoizeThrottleOptions extends memoizeDebounceOptions {
  trailing?: boolean;
}

export function memoizeThrottle<T extends (...args: any[]) => any>(
  func: T, 
  wait: number = 0, 
  options: memoizeThrottleOptions = {}
): T {
  const mem = memoize(function() {
    return throttle(func, wait, {
      leading: options.leading,
      trailing: options.trailing
    });
  }, options.resolver);

  return function(this: ThisType<any>, ...args: any[]): any {
    return mem.apply(this, args as []).apply(this, args as Parameters<T>);
  } as T;
}
