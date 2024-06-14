import { Address } from "./Address";

export class Packet {
  socket: number;
  destination: Address;
  source: Address;
  data: Buffer;

  constructor(
    socket: number,
    data: Buffer,
    source: Address,
    destination: Address
  ) {
    this.data = data;
    this.socket = socket;
    this.source = source;
    this.destination = destination;
  }

  static serialize(...packets: Packet[]): string {
    const output: string[] = [];
    packets.forEach((packet) => {
      const data = [
        packet.socket.toString(36),
        atob(packet.destination?.hostname ?? ""),
        packet.destination?.port.toString(36) ?? "",
        atob(packet.source.hostname),
        packet.source.port.toString(36),
        packet.data.toString("base64"),
      ].join(",");
      output.push(data);
    });

    return output.join("|");
  }

  static deserialize(serialized: string): Packet[] {
    const packets: Packet[] = [];
    serialized.split("|").forEach((packet) => {
      const [socket, dstHostname, dstPort, srcHostname, srcPort, ...dataArray] =
        packet.split(",");
      const dataString = dataArray.join(",");

      const destination = new Address(btoa(dstHostname), parseInt(dstPort, 36));
      const source = new Address(btoa(srcHostname), parseInt(srcPort, 36));

      packets.push(
        new Packet(
          parseInt(socket, 36),
          Buffer.from(dataString, "binary"),
          source,
          destination
        )
      );
    });
    return packets;
  }
}
