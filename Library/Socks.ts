import type { Socket } from "bun";
import type { Connection } from "./Connection";
import type { ITunnel } from "./Tunnel";

export class SocksServer implements ITunnel
{
  constructor()
  {
    
  }

  write(data: Buffer)
  {
  }
}

export class SocksConn implements Connection
{
  private socket: Socket<SocksConn>;
  private greeting: boolean = false;
  private authorized: boolean = false;

  constructor(socket: Socket<SocksConn>)
  {
    this.socket = socket;
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
