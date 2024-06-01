import type { Socket } from "bun";
import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Socks5Template } from "../Templates/Socks5";

export class Socks5Server extends Tunnel {
  constructor(gateway: ITunnel) {
    super(gateway);
  }

  write(packet: Packet): void {
    const socket: Socket<Socks5Template> = Pointer.to(packet.socket);
    const verify = socket.data.verify(packet.data);
    if (verify == false) {
      return;
    }

    packet.destination = socket.data.destination;

    this._gateway.write(packet);
  }
}
