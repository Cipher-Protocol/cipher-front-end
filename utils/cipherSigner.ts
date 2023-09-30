import { EddsaSigner } from "./eddsa";

export class cipherSigner {
  private signer: EddsaSigner;

  get pubKey(): [bigint, bigint] {
    const pub = this.signer.pubKey.map((x) =>
      BigInt(EddsaSigner.toObject(x).toString())
    );
    return [pub[0], pub[1]];
  }

  constructor(priv: Buffer) {
    this.signer = new EddsaSigner(priv);
  }
}
