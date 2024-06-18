import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

interface IRouter {
  tunnel: ITunnel;
  verify: (packet: Packet) => boolean;
}

export class Router extends Tunnel {
  private _gateways: IRouter[];
  constructor(gateway: ITunnel, ...gateways: IRouter[]) {
    super(gateway);
    this._gateways = gateways;
  }
  async write(...packets: Packet[]): Promise<void> {
    packets.forEach((packet) => {
      for (let i = 0; i < this._gateways.length; i++) {
        const gateway = this._gateways[i];
        if (gateway.verify(packet)) {
          gateway.tunnel.write(packet);
          return;
        }
      }
      this._gateway.write(packet);
    });
  }
}
