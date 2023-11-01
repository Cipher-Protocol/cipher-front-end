import { getString } from "../utils/helper";

// import { groth16 } from "snarkjs"
const snarkjs = require("snarkjs");
const groth16 = snarkjs["groth16"];
const CIRCUIT_BASE_URL = getString(process.env.NEXT_PUBLIC_CIPHER_CIRCUIT_BASE_URL, {
  defaultVal: '',
});

export async function prove(
  inputContent: any,
  {
    heightName,
    specName,
  }: {
    heightName: string;
    specName: string;
  }
) {
  const wasmUri = `${CIRCUIT_BASE_URL}/circuits/${heightName}/${specName}/${heightName}${specName}_js/${heightName}${specName}.wasm`;
  const zkeyUri = `${CIRCUIT_BASE_URL}/circuits/${heightName}/${specName}/${heightName}${specName}_final.zkey`

  const { proof, publicSignals } = await groth16.fullProve(
    inputContent,
    wasmUri,
    zkeyUri,
    console
  );

  const { calldata } = await generateSolidityCalldata(
    proof,
    publicSignals,
  );

  return {
    calldata,
  };
}

async function generateSolidityCalldata(
  proof: any,
  publicSignals: any,
) {
  const stdout = await groth16.exportSolidityCallData(proof, publicSignals);
  const raw = `[${stdout}]`;
  const calldata = JSON.parse(raw);
  return {
    calldata,
  };
}
