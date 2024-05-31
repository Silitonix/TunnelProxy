export class Packet {
  source: number;
  data: Buffer;
  constructor(source: number, data: Buffer) {
    this.data = data;
    this.source = source;
  }
}
