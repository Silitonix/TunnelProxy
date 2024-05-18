import type { Connection } from "./Connection";
import type { ServerOptions } from "./Server";
import type { Tunnel } from "./Tunnel";

export class SocksServer implements Tunnel
{
  gateway: Tunnel;
  constructor(gateway: Tunnel)
  {
    this.gateway = gateway;
  }

  write(data: Buffer)
  {
  }
}

class SocksConn implements Connection
{
  greeting: boolean = false;

  constructor()
  {

  }

  ClientGreeting()
  {
  }

  write(data: Buffer): void
  {
    throw new Error("Method not implemented.");
  }
  close(): void
  {
    throw new Error("Method not implemented.");
  }
}
