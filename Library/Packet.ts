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
  static serialize(...packets: Packet[]): string {
    const output: string[] = [];
    packets.forEach((packet) => {
      const data = [
        btoa(JSON.stringify(packet.source)),
        btoa(JSON.stringify(packet.destination)),
        packet.data.toString("base64"),
      ];
      output.push(data.join(","));
    });

    return output.join("|");
  }

  static deserialize(serialized: string): Packet[] {
    const packets: Packet[] = [];
    serialized.split("|").forEach((packet) => {
      const [src, dst, ...dataArray] = packet.split(",");
      const dataString = dataArray.join(",");

      const dstObj = JSON.parse(atob(dst));
      const srcObj = JSON.parse(atob(src));

      const destination = Address.clone(dstObj);
      const source = Address.clone(srcObj);

      packets.push(
        new Packet(Buffer.from(dataString, "base64"), source, destination)
      );
    });
    return packets;
  }
}
