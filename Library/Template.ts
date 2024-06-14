import type { Socket } from "bun";
import type { Socks5Template } from "../Templates/Socks5";
import type { Address } from "./Address";

export interface ISocketSchema {
  verify(data: Buffer): boolean;
}

export abstract class SocketTemplate implements ISocketSchema {
  socket: Socket<Socks5Template>;
  source: Address;
  destination: Address;
  constructor(
    socket: Socket<Socks5Template>,
    source: Address,
    destination: Address
  ) {
    this.socket = socket;
    this.source = source;
    this.destination = destination;
  }
  verify(data: Buffer): boolean {
    throw new Error("Method not implemented.");
  }
}
