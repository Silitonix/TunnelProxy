import type { Socket } from "bun";
import type { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { DefaultTemplate } from "../Templates/Default";

export class TCPClient extends Tunnel {
  conns: Map<Address, Socket<DefaultTemplate>> = new Map();
  remote?: Address;
  constructor(gateway: ITunnel, address?: Address) {
    super(gateway);
    this.remote = address;
  }

  async connect(packet: Packet) {
    const destination = this.remote ?? packet.destination;
    try {
      const socket = await Bun.connect<DefaultTemplate>({
        hostname: destination.hostname,
        port: destination.port,
        socket: {
          open(socket) {
            socket.data = new DefaultTemplate(
              packet.source.clone,
              packet.destination.clone
            );
            socket.write(packet.data);
          },
          data: this.data.bind(this),
          error: this.close,
          close: this.close,
          connectError: this.connectError,
        },
      });
  
      this.conns.set(packet.source, socket);
    } catch (error) {
      console.log(error);
      
    }
  }

  async write(...packets: Packet[]): Promise<void> {
    packets.forEach((packet) => {
      const destination = packet.destination;
      const socket = this.conns.get(packet.source);

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
  close(socket: Socket<DefaultTemplate>) {}
  connectError(socket: Socket<DefaultTemplate>, error: Error) {
    
  }
}
