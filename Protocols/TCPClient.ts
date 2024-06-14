import type { Socket } from "bun";
import type { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";

export class TCPClient extends Tunnel {
  constructor(gateway: ITunnel) {
    super(gateway);
  }
  write(...packets: Packet[]): void {
    packets.forEach((packet) => {
      Bun.connect<Packet>({
        hostname: packet.destination.hostname,
        port: packet.destination.port,
        socket: {
          open(socket) {
            const pointer = Pointer.from(socket);
            socket.data = new Packet(
              pointer,
              Buffer.from([]),
              packet.source,
              packet.destination
            );
          },
          data: this.data.bind(this),
          drain(socket) {
            socket.write(packet.data);
          },
        },
      });
    });
  }
  data(socket: Socket<Packet>, data: Buffer) {
    const packet = new Packet(
      socket.data.socket,
      data,
      socket.data.source,
      socket.data.destination
    );
    this._gateway.write(packet);
  }
}
