import type { Address } from "./Address";

export class Packet {
  socket: number;
  destination?: Address;
  source: Address;
  data: Buffer;

  constructor(
    socket: number,
    data: Buffer,
    source: Address,
    destination?: Address
  ) {
    this.data = data;
    this.socket = socket;
    this.source = source;
    this.destination = destination;
  }
}
