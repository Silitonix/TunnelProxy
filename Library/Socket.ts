import type { Socket } from "bun";
import type { Address } from "./Address";
import type { Packet } from "./Packet";
import type { ITunnel, Tunnel } from "./Tunnel";

export type SocketClass<Type> = new (
  socket: Socket<Type>,
  source: Address,
  destination: Address
) => Type;
export interface ISocketServer {
  listen(gateway: Tunnel): void;
}

export abstract class SocketServer implements ISocketServer, ITunnel {
  source: Address;

  constructor(source: Address) {
    this.source = source;
  }
  write(...packets: Packet[]): void {
    throw new Error("Method not implemented.");
  }
  listen(gateway: Tunnel): void {
    throw new Error("Method not implemented.");
  }
}
