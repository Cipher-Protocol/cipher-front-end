import { BigNumber, utils } from "ethers";
import { SNARK_FIELD_SIZE } from "../configs/tokenConfig";

export const getRandomSnarkField = () => {
  const seed = utils.randomBytes(32);
  const hashSeed = hashSeedHundredTimes(seed);
  const random = BigNumber.from(hashSeed).mod(SNARK_FIELD_SIZE);
  return random;
};

const hashSeedHundredTimes = (seed: Uint8Array) => {
  let hash = seed;
  for (let i = 0; i < 100; i++) {
    hash = utils.arrayify(utils.keccak256(hash));
  }
  return hash;
};
