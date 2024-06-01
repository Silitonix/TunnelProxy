import type { Address } from "../Library/Address";
import type { Packet } from "../Library/Packet";
import { Tunnel } from "../Library/Tunnel";

class HTTPClient extends Tunnel {
  constructor(gateway: Tunnel, address: Address) {
    super(gateway);
  }

  write(packet: Packet): void {}
}
