// import * as circomlibjs from "circomlibjs"
const circomlibjs = require("circomlibjs");

export type EdDSAPublicKeyType = [Uint8Array, Uint8Array];

export let EdDSA: any;
export const asyncEdDSA = circomlibjs.buildEddsa();
(async function () {
  EdDSA = await asyncEdDSA;
})();

export class EddsaSigner {
  private privKey: Buffer;
  public pubKey: EdDSAPublicKeyType;

  constructor(privKey: Buffer) {
    this.privKey = privKey;
    this.pubKey =
      privKey.length === 0
        ? [new Uint8Array(), new Uint8Array()]
        : EdDSA.prv2pub(privKey);
  }

  static toObject(i: Uint8Array): bigint {
    return EdDSA.babyJub.F.toObject(i);
  }
}
