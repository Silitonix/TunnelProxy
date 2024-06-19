import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Deserializer extends Tunnel {
  constructor(gateway: ITunnel) {
    super(gateway);
  }

  async write(...packets: Packet[]): Promise<void> {
    const deserialized = packets.map((packet) => {
      const newPacket = packet.deserialized;
      return newPacket;
    });
    this._gateway.write(...deserialized);
  }
}
