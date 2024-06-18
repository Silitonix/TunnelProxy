import type { Socket } from "bun";
import type { Address } from "./Address";

export class SocketTemplate {
  source: Address;
  destination: Address;
  constructor(source: Address, destination: Address) {
    this.source = source;
    this.destination = destination;
  }
}
