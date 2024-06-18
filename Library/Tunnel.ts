import type { Packet } from "./Packet";

export interface ITunnel {
  write(...packets: Packet[]): void;
}

export abstract class Tunnel implements ITunnel {
  protected _gateway: ITunnel;
  constructor(gateway: ITunnel) {
    this._gateway = gateway;
  }

  async write(...packets: Packet[]): Promise<void> {}
}
