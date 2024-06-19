import { Address } from "./Address";

export class Packet {
  destination: Address;
  source: Address;
  data: Buffer;

  constructor(data: Buffer, source: Address, destination: Address) {
    this.data = data;
    this.source = source;
    this.destination = destination;
  }
  get clone() {
    return new Packet(this.data, this.source.clone, this.destination.clone);
  }

  static readonly emptyBuffer = Buffer.from([]);

  get serialized(): Buffer {
    const data = [
      btoa(JSON.stringify(this.source)),
      btoa(JSON.stringify(this.destination)),
      this.data.toString("base64"),
    ];
    return Buffer.from(data.join(","), "binary");
  }

  get deserialized(): Packet {
    const [src, dst, ...dataArray] = this.data.toString("binary").split(",");
    const dataString = dataArray.join(",");

    const dstObj = JSON.parse(atob(dst));
    const srcObj = JSON.parse(atob(src));

    const destination = Address.clone(dstObj);
    const source = Address.clone(srcObj);

    return new Packet(Buffer.from(dataString, "base64"), source, destination);
  }
}
