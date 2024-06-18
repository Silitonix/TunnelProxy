import type { Socket } from "bun";
import type { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { DefaultTemplate } from "../Templates/Default";

export class TCPClient extends Tunnel {
  remote?: Address;
  constructor(gateway: ITunnel, address?: Address) {
    super(gateway);
    this.remote = address;
  }

  connect(packet: Packet) {
    const destination = this.remote ?? packet.destination;
    Bun.connect<DefaultTemplate>({
      hostname: destination.hostname,
      port: destination.port,
      socket: {
        open(socket) {
          const pointer = Pointer.from(socket);
          packet.destination.socket.push(pointer);
          socket.data = new DefaultTemplate(packet.source, packet.destination);
          socket.write(packet.data);
        },
        data: this.data.bind(this),
        error: this.close,
        close: this.close,
        connectError: this.close,
      },
    });
  }

  async write(...packets: Packet[]): Promise<void> {
    packets.forEach((packet) => {
      const socket = Pointer.to(packet.destination.activeSocket) as Socket<DefaultTemplate>;

      if (socket == undefined) {
        this.connect(packet);
        return;
      }

      socket.write(packet.data);
    });
  }

  data(socket: Socket<DefaultTemplate>, data: Buffer) {
    const packet = new Packet(
      data,
      socket.data.source,
      socket.data.destination
    );
    this._gateway.write(packet);
  }
  close(socket: Socket<Packet>) {
    Pointer.delete(socket);
  }
}
