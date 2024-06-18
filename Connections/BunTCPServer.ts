import type { Socket } from "bun";
import { SocketServer, type SocketClass } from "../Library/Socket";
import { Tunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Packet } from "../Library/Packet";
import { Address } from "../Library/Address";
import type { SocketTemplate } from "../Library/Template";

export class BunTCPServer<T extends SocketTemplate> extends SocketServer {
  blueprint: SocketClass<T>;
  private _gateway?: Tunnel;
  constructor(source: Address, blueprint: SocketClass<T>) {
    super(source);
    this.blueprint = blueprint;
  }
  write(...packets: Packet[]): void {
    packets.forEach((packet) => {
      const pointer = packet.source.activeSocket;
      const socket = Pointer.to(pointer) as Socket;
      socket.write(packet.data);
    });
  }

  listen(gateway: Tunnel): void {
    this._gateway = gateway;
    Bun.listen<T>({
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

  open(socket: Socket<T>): void {
    const pointer = Pointer.from(socket);
    const source = this.source.clone;
    source.socket.push(pointer);

    socket.data = new this.blueprint(source, Address.empty);
  }

  data(socket: Socket<T>, data: Buffer): void {
    const destination = socket.data.destination;
    const source = socket.data.source;

    const packet = new Packet(data, source, destination);
    this._gateway?.write(packet);
  }
  close(socket: Socket<T>) {
    Pointer.delete(socket);
  }

  error(socket: Socket<T>, error: Error): void {
    socket.end();
    console.log(error);
  }
}
