import type { Socket } from "bun";
import type { Socks5Schema } from "../Schema/Socks5";

export interface ISocketSchema {
  verify(data: Buffer): boolean;
}

export abstract class SocketSchema implements ISocketSchema {
  socket: Socket<Socks5Schema>;

  constructor(socket: Socket<Socks5Schema>) {
    this.socket = socket;
  }
  verify(data: Buffer): boolean {
    throw new Error("Method not implemented.");
  }
}
