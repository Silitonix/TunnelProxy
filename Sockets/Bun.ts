import type { Socket } from "bun";
import type { ISocket, SocketClass } from "../Library/Socket";
import { Tunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Packet } from "../Library/Packet";

export class BunTCP<Type> extends Tunnel implements ISocket {
  blueprint: SocketClass<Type>;
  constructor(gateway: Tunnel, blueprint: SocketClass<Type>) {
    super(gateway);
    this.blueprint = blueprint;
  }

  listen(hostname: string, port: number): void {
    Bun.listen<Type>({
      hostname: hostname,
      port: port,
      socket: {},
    });
  }
  open(socket: Socket<Type>): void {
    socket.data = new this.blueprint();
  }

  data(socket: Socket<Type>, data: Buffer): void {
    const pointer = Pointer.from(socket);
    const packet = new Packet(pointer, data);
    this._gateway.write(packet);
  }
}
