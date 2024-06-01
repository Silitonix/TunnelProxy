import type { Socket } from "bun";
import { SocketServer } from "../Library/Socket";
import { type ISocketServer, type SocketClass } from "../Library/Socket";
import { Tunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Packet } from "../Library/Packet";
import type { Address } from "../Library/Address";

export class BunTCPServer<Type> extends SocketServer implements ISocketServer {
  blueprint: SocketClass<Type>;

  constructor(gateway: Tunnel, source: Address, blueprint: SocketClass<Type>) {
    super(gateway, source);
    this.blueprint = blueprint;
  }

  listen(): void {
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
    this._gateway.write(packet);
  }
}
