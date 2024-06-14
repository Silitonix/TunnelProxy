import type { Socket } from "bun";
import { SocketServer, type SocketClass } from "../Library/Socket";
import { Tunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Packet } from "../Library/Packet";
import { Address } from "../Library/Address";
import type { SocketTemplate } from "../Library/Template";

export class BunTCPServer<Type extends SocketTemplate> extends SocketServer {
  blueprint: SocketClass<Type>;
  private _gateway?: Tunnel;
  constructor(source: Address, blueprint: SocketClass<Type>) {
    super(source);
    this.blueprint = blueprint;
  }
  write(...packets: Packet[]): void {
    packets.forEach((packet) => {
      const socket = Pointer.to<Socket<Type>>(packet.socket);
      socket.write(packet.data);
    });
  }

  listen(gateway: Tunnel): void {
    this._gateway = gateway;
    Bun.listen<Type>({
      hostname: this.source.hostname,
      port: this.source.port,
      socket: {
        open: this.open.bind(this),
        data: this.data.bind(this),
        error: this.error.bind(this),
        close: this.close.bind(this),
      },
    });
    console.log("Listenning on %s:%s", this.source.hostname, this.source.port);
  }

  open(socket: Socket<Type>): void {
    socket.data = new this.blueprint(socket, this.source, Address.empty);
  }

  data(socket: Socket<Type>, data: Buffer): void {
    const pointer = Pointer.from(socket);
    const destination = socket.data.destination;
    const packet = new Packet(pointer, data, this.source, destination);
    this._gateway?.write(packet);
  }
  close(socket: Socket<Type>) {
    Pointer.delete(socket);
  }

  error(socket: Socket<Type>, error: Error): void {
    socket.end();
    console.log(error);
  }
}
