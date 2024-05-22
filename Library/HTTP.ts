import type { ITunnel } from "./Tunnel";

export class HTTPClient implements ITunnel
{
  constructor(address: string, port = 80)
  {
  }
  write(data: Buffer): void
  {
    throw new Error("Method not implemented.");
  }
}