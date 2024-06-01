import type { Address } from "../Library/Address";
import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class HTTPClient extends Tunnel {
  constructor(gateway: ITunnel, address: Address) {
    super(gateway);
  }

  write(packet: Packet): void {}
}
