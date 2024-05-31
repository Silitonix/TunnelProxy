import type { Packet } from "../Library/Packet";
import { Tunnel } from "../Library/Tunnel";

class HTTPClient extends Tunnel {
  constructor(gateway: Tunnel, hostname: string, port: number) {
    super(gateway);
  }

  write(packet: Packet): void {
    
  }
}
