import type { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Serializer extends Tunnel {
  target?: Address;
  disolve: boolean;

  constructor(gateway: ITunnel, target?: Address, disolve: boolean = false) {
    super(gateway);
    this.target = target;
    this.disolve = disolve;
  }
  async write(...packets: Packet[]): Promise<void> {
    packets.forEach((packet, i) => {
      const newPacket = packet.clone;

      if (this.target) {
        newPacket.destination = this.target;
      }
      const pack = Packet.serialize(packet);
      newPacket.data = Buffer.from(pack);

      packets[i] = newPacket;
    });
    this._gateway.write(...packets);
  }
}
