import type { Address } from "./Address";
import { Tunnel } from "./Tunnel";

export type SocketClass<Type> = new (...any: any[]) => Type;

export interface ISocketServer {
  listen(address: Address): void;
}

export abstract class SocketServer extends Tunnel implements ISocketServer {
  source: Address;

  constructor(gateway: Tunnel, source: Address) {
    super(gateway);
    this.source = source;
  }
  listen(): void {
    throw new Error("Method not implemented.");
  }
}
