import type { Socket } from "bun";
import { SocketSchema, type ISocketSchema } from "../Library/Schema";

export class Socks5Schema extends SocketSchema {
  isGreeted: boolean = false;
  isAuthorized: boolean = false;
  isRouted: boolean = false;
  isVerified: boolean = false;

  constructor(socket: Socket<Socks5Schema>) {
    super(socket);
  }

  verify(data: Buffer): boolean {
    const [version, ...msg] = Array.from(data);

    if (this.isVerified) {
      return true;
    }

    if (version !== 0x05) {
      this.socket.end();
      return false;
    }

    this.greeting(msg);
    this.authorize(msg);
    this.route(msg);

    return false;
  }

  private greeting(data: number[]): void {
    if (this.isGreeted) return;

    const nMethods = data[0];
    const methods = data.slice(1, 1 + nMethods);
    if (nMethods === 0 || !methods.includes(0x00)) {
      this.socket.end();
      return;
    }
    this.socket.write(Buffer.from([0x05, 0x00]));
    this.isGreeted = true;
  }

  private authorize(data: number[]): void {
    if (this.isAuthorized) return;
    this.isAuthorized = true;
  }

  private route(data: number[]) {
    if (this.isRouted) return;
  }
}
