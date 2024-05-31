import type { Socket } from "bun";
import type { ISocketSchema } from "../Library/Socket";

export class Socks5Schema implements ISocketSchema {
  isGreeted: boolean = false;
  isAuthorized: boolean = false;
  socket: Socket<Socks5Schema>;

  constructor(socket: Socket<Socks5Schema>) {
    this.socket = socket;
  }

  greeting(version: number, data: number[]) {
    const nMethods = data[0];
    const methods = data.slice(1, 1 + nMethods);

    if (nMethods == 0 || !methods.includes(0x00)) {
      this.socket.end();
      return;
    }

    this.socket.write(Buffer.from([0x05, 0x00]));
    this.isGreeted = true;
  }

  authorize(version: number, data: number[]) {
    this.isAuthorized = true;
  }

  verify(data: Buffer): boolean {
    const [version, ...msg] = data;

    if (version !== 0x05 && (!this.isGreeted || !this.isAuthorized)) {
      this.socket.end();
      return false;
    }

    if (!this.isGreeted) {
      this.greeting(version, msg);
      return false;
    }

    // Handle authorization if not authorized
    if (!this.isAuthorized) {
      this.authorize(version, msg);
      return false;
    }

    // If greeted and authorized, verification passes
    return true;
  }
}
