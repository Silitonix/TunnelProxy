import type { Server } from "bun";
import type { Address } from "../Library/Address";
import type { Packet } from "../Library/Packet";
import { SocketServer } from "../Library/Socket";
import type { Tunnel } from "../Library/Tunnel";

export class BunHTTPServer extends SocketServer {
  constructor(source: Address) {
    super(source);
  }

  listen(gateway: Tunnel): void {
    Bun.serve({
      port: this.source.port,
      hostname: this.source.hostname,
      async fetch(request: Request, server: Server): Promise<Response> {
        return new Response()
      },
    });
  }
  write(...packets: Packet[]): void {}
}
