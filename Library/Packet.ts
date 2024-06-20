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

  static clone(struct: Packet) {
    const clone = new Packet(
      Buffer.from(struct.data),
      Address.clone(struct.source),
      Address.clone(struct.destination)
    );
    return clone;
  }
  static readonly emptyBuffer = Buffer.from([]);
  get serialized(): Buffer {
    const data = [
      this.source.hostname,
      this.source.port,
      this.source.socket.join("."),
      this.destination.hostname,
      this.destination.port,
      this.destination.socket.join("."),
      this.data.toString("base64"),
    ];
    return Buffer.from(data.join(","));
  }

  get deserialized(): Packet {
    const raw = this.data.toString();

    const [
      srcHostname,
      srcPort,
      srcSocket,
      dstHostname,
      dstPort,
      dstSocket,
      data,
    ] = raw.split(",");

    const srcSocketArray = srcSocket.split(".").map(Number);
    const dstSocketArray = dstSocket.split(".").map(Number);
    const src = new Address(srcHostname, Number(srcPort), ...srcSocketArray);
    const dst = new Address(dstHostname, Number(dstPort), ...dstSocketArray);
    const buffer = Buffer.from(data, "base64");

    const packet = new Packet(buffer, src, dst);
    return packet;
  }
}
