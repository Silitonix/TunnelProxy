import type { Socket } from "bun";
import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Socks5Schema } from "./Socks5";


export class Socks extends Tunnel
{
  constructor(gateway: ITunnel)
  {
    super(gateway);
  }

  write(packet: Packet): void
  {
    const socket: Socket<Socks5Schema> = Pointer.to(packet.source);
    const verify = socket.data.verify(packet.data);
    if(verify == false)
    {
      return;
    }
    this._gateway.write(packet);
  }

}
