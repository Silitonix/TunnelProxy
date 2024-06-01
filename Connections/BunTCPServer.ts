import type { Socket } from "bun";
import { SocketServer, type SocketClass } from "../Library/Socket";
import { Tunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Packet } from "../Library/Packet";
import type { Address } from "../Library/Address";

export class BunTCPServer<Type> extends SocketServer {
  blueprint: SocketClass<Type>;
  private _gateway?: Tunnel;
  constructor(source: Address, blueprint: SocketClass<Type>) {
    super(source);
    this.blueprint = blueprint;
  }
  write(packet: Packet): void {
    const socket = Pointer.to<Socket<Type>>(packet.socket);
    socket.write(packet.data);
  }

  listen(gateway: Tunnel): void {
    this._gateway = gateway;
    Bun.listen<Type>({
      hostname: this.source.hostname,
      port: this.source.port,
      socket: {},
    });
  }

  open(socket: Socket<Type>): void {
    socket.data = new this.blueprint();
  }

  data(socket: Socket<Type>, data: Buffer): void {
    const pointer = Pointer.from(socket);
    const packet = new Packet(pointer, data, this.source);
    this._gateway?.write(packet);
  }
}
