import type { Socket } from "./Socket";
import type { Connection } from "./Connection";
import type { Tunnel } from "./Tunnel";

export class BunTCP<Type> implements Socket
{
  hostname: string;
  port: number;
  data:typeof Type;

  constructor(hostname: string, port: number,data:typeof Type)
  {
    this.hostname = hostname;
    this.port = port;
  }

  listen(tunnel: Tunnel)
  {
    Bun.listen<Type>({
      hostname: this.hostname,
      port: this.port,
      socket: {},
    });
  }
}