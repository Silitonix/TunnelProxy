import type { Tunnel } from "./Tunnel";

export class HTTPClient implements Tunnel
{
  constructor(address: string, port = 80)
  {
  }
  write(data: Buffer): void
  {
    throw new Error("Method not implemented.");
  }
}