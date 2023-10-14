// import { groth16 } from "snarkjs"
const snarkjs = require("snarkjs");
const groth16 = snarkjs["groth16"];
export async function prove(
  inputContent: any,
  wasm: Uint8Array | string,
  zkey: Uint8Array | string
) {

  const { proof, publicSignals } = await groth16.fullProve(
    inputContent,
    wasm,
    zkey,
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
