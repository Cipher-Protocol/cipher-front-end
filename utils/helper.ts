import { throttle } from "lodash";

export function getBoolean(str: string | undefined, defaultVal?: boolean) {
  try {
    if (str === "" || typeof str === "undefined")
      throw new Error(`'${str}' is not a boolean`);
    return !!JSON.parse(str.toLowerCase());
  } catch (error) {
    if (typeof defaultVal !== "undefined") {
      return defaultVal;
    }
    throw new Error(`'${str}' is not a boolean`);
  }
}

export function getNumber(str: string | undefined, {
  defaultVal = undefined,
} = {} as {
  defaultVal?: string | undefined;
}) {
  const val = str !== undefined && str !== '' ? str : defaultVal;
  if (val === "" || typeof val === "undefined")
    throw new Error(`'${val}' is not a number`);
  const num = JSON.parse(val);
  if (typeof num === "number") {
    return num;
  }
  throw new Error(`'${str}' is not a number`);
}

export function getString(str: string | undefined, {
  defaultVal = undefined,
  required = false,
}: {
  defaultVal?: string | undefined;
  required?: boolean;
} = {}) {
  try {
    const val = str !== undefined && str !== '' ? str : defaultVal;
    if (required && (val === "" || typeof val === "undefined"))
      throw new Error(`'${str}' is not a string`);
    return val as string;
  } catch (error) {
    throw new Error(`'${str}' is not a string`);
  }
}

export function getBigInt(str: string | undefined, {
  defaultVal = undefined,
} = {}) {
  try {
    const val = str !== undefined && str !== '' ? str : defaultVal;
    if (val === "" || typeof val === "undefined")
      throw new Error(`'${str}' is not a bigint`);
    return BigInt(val);
  } catch (error) {
    throw new Error(`'${str}' is not a bigint`);
  }
}


export class cachedThrottle<T> {
  lastValue: T | undefined;
  lastTime: number | undefined;
  func(): Promise<T> | undefined {
    throw new Error("Method not implemented.");
  }
  constructor(func: () => Promise<T>, time: number, config: {
    leading: boolean;
    trailing: boolean;
  }) {
    this.func = throttle(func, time, config);
  }

  async execute() {
    const r = await this.func();
    if (r === undefined) {
      return this.lastValue as T;
    }
    this.lastValue = r;
    this.lastTime = Date.now();
    return r;
  }
}