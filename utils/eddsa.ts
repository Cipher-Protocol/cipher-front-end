const circomlibjs = require('circomlibjs');

export let EdDSA: any;
export const asyncEdDSA: Promise<any> = circomlibjs.buildEddsa();
(async function () {
  EdDSA = await asyncEdDSA;
})();
export type EdDSAPublicKeyType = [Uint8Array, Uint8Array];
export type TsPublicKeyType = [bigint, bigint];

export type EdDSASignaturePayload = {
  R8: [Uint8Array, Uint8Array];
  S: bigint;
};
export type TsSignaturePayload = {
  R8: [bigint, bigint];
  S: bigint;
};

export class EddsaSigner {
  private privateKey: Buffer;
  public publicKey: EdDSAPublicKeyType;

  constructor(privateKey: Buffer) {
    if (!EdDSA) {
      throw new Error('EdDSA is not initialized yet');
    }
    if (privateKey.length !== 32) {
      throw new Error('private key length must be 32 bytes');
    }
    this.privateKey = privateKey;
    this.publicKey = EdDSA.prv2pub(privateKey);
  }

  static toObject(i: Uint8Array): bigint {
    return EdDSA.babyJub.F.toObject(i);
  }

  static toE(i: bigint): Uint8Array {
    return EdDSA.babyJub.F.e(i);
  }

  static verify(msgHash: Uint8Array, signature: EdDSASignaturePayload, publicKey: EdDSAPublicKeyType): boolean {
    return EdDSA.verifyPoseidon(msgHash, signature, publicKey);
  }

  static verifyMessage(msgHash: bigint, signature: TsSignaturePayload, tsPubKey: TsPublicKeyType): boolean {
    return EddsaSigner.verify(
      EddsaSigner.toE(msgHash),
      {
        R8: [EddsaSigner.toE(signature.R8[0]), EddsaSigner.toE(signature.R8[1])],
        S: signature.S,
      },
      [EddsaSigner.toE(tsPubKey[0]), EddsaSigner.toE(tsPubKey[1])],
    );
  }

  signPoseidon(msgHash: bigint): EdDSASignaturePayload {
    const msgField = EddsaSigner.toE(msgHash);
    const signature: EdDSASignaturePayload = EdDSA.signPoseidon(this.privateKey, msgField);
    return signature;
  }
}
