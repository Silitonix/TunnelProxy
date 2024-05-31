export class Packet {
  source: number;
  destination?: string;
  data: Buffer;

  constructor(source: number, data: Buffer,destination?: string) {
    this.data = data;
    this.source = source;
    this.destination = destination;
  }
}
