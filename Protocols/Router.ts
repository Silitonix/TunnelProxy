import type { Address } from "../Library/Address";
import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

interface IRouter {
  tunnel: ITunnel;
  verify: (domain?: Address) => boolean;
}

export class Router extends Tunnel {
  private _gateways: IRouter[];
  constructor(gateway: ITunnel, ...gateways: IRouter[]) {
    super(gateway);
    this._gateways = gateways;
  }
  write(...packets: Packet[]): void {
    packets.forEach((packet) => {
      for (let i = 0; i < this._gateways.length; i++) {
        const gateway = this._gateways[i];
        if (gateway.verify(packet.destination)) {
          gateway.tunnel.write(packet);
          return;
        }
      }
      this._gateway.write(packet);
    });
  }
}
