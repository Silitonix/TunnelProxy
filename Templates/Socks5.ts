import type { Socket } from "bun";
import { SocketTemplate } from "../Library/Template";
import { Socks5Command } from "./Socks5Command";
import { Address } from "../Library/Address";

export class Socks5Template extends SocketTemplate {
  isGreeted: boolean = false;
  isAuthorized: boolean = false;
  isRouted: boolean = false;
  isVerified: boolean = false;
  destination?: Address;
  protocol?: Socks5Command;
  binaryAddress?: Buffer;

  constructor(socket: Socket<Socks5Template>, source: Address) {
    super(socket, source);
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

    return this.isVerified;
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

  private route(data: number[]): void {
    if (this.isRouted) return;

    const address = Address.fromBinary(data.slice(3));

    if (!address) {
      this.socket.end();
      return;
    }

    this.destination = address;
    this.protocol = data[0];

    this.isRouted = true;
    this.isVerified = true;

    let response: number[] = [0x05, 0x00, 0x00];
    response.concat(Address.toBinary(this.source));

    this.socket.write(Buffer.from(response));
  }
}
