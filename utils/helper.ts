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

export function getNumber(str: string | undefined) {
  if (str === "" || typeof str === "undefined")
    throw new Error(`'${str}' is not a number`);
  const num = JSON.parse(str);
  if (typeof num === "number") {
    return num;
  }
  throw new Error(`'${str}' is not a number`);
}

export function getString(str: string | undefined) {
  try {
    if (str === "" || typeof str === "undefined")
      throw new Error(`'${str}' is not a string`);
    return str;
  } catch (error) {
    throw new Error(`'${str}' is not a string`);
  }
}

export function getBigInt(str: string | undefined) {
  try {
    if (str === "" || typeof str === "undefined")
      throw new Error(`'${str}' is not a bigint`);
    return BigInt(str);
  } catch (error) {
    throw new Error(`'${str}' is not a bigint`);
  }
}
