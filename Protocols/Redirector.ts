import type { Address } from "../Library/Address";
import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Redirector extends Tunnel {
  target: Address;
  constructor(gateway: ITunnel, target: Address) {
    super(gateway);
    this.target = target;
  }
  async write(...packets: Packet[]): Promise<void> {
    const redirected = packets.map((packet) => {
      packet.destination = this.target;
      return packet;
    });
    this._gateway.write(...redirected);
  }
}
