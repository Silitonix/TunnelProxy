import type { Socket } from "bun";
import { SocketSchema, type ISocketSchema } from "../Library/Schema";

export class Socks5Schema extends SocketSchema {
  isGreeted: boolean = false;
  isAuthorized: boolean = false;

  constructor(socket: Socket<Socks5Schema>) {
    super(socket);
  }

  verify(data: Buffer): boolean {
    const [version, ...msg] = Array.from(data);

    if (version !== 0x05 && (!this.isGreeted || !this.isAuthorized)) {
      this.socket.end();
      return false;
    }

    if (!this.isGreeted) {
      this.greeting(msg);
      return false;
    }

    if (!this.isAuthorized) {
      this.authorize(msg);
      return false;
    }

    return true;
  }

  private greeting(data: number[]): void {
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
    this.isAuthorized = true;
  }

  private route() {}
}
