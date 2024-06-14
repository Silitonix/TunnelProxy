import type { Socket } from "bun";
import { SocketTemplate } from "../Library/Template";
import { Socks5Command } from "./Socks5Command";
import { Address } from "../Library/Address";

export class Socks5Template extends SocketTemplate {
  isGreeted: boolean = false;
  isAuthorized: boolean = false;
  isRouted: boolean = false;
  isVerified: boolean = false;
  protocol: Socks5Command = Socks5Command.TCPBind;
  binaryAddress?: Buffer;

  constructor(
    socket: Socket<Socks5Template>,
    source: Address,
    destination: Address
  ) {
    super(socket, source, destination);
  }

  verify(data: Buffer): boolean {
    const [version, ...msg] = Array.from(data);

    if (this.isVerified) {
      return true;
    }

    if (version !== 0x05) {
      console.log("Connection with invalid version : %s", version);
      this.socket.end();
      return false;
    }

    if (this.greeting(msg)) return false;
    if (this.authorize(msg)) return false;
    if (this.route(msg)) return false;

    return this.isVerified;
  }

  private greeting(data: number[]): boolean {
    if (this.isGreeted) return false;

    const nMethods = data[0];
    const methods = data.slice(1);

    if (nMethods == 0 || !methods.includes(0x00)) {
      console.log("invalid auth methods %s", methods);
      this.socket.end();
      return true;
    }

    this.socket.write(Buffer.from([0x05, 0x00]));
    return (this.isGreeted = true);
  }

  private authorize(data: number[]): boolean {
    if (this.isAuthorized) return false;
    this.isAuthorized = true;
    return false;
  }

  private route(data: number[]): boolean {
    if (this.isRouted) return false;

    const address = Address.fromBinary(data.slice(2));

    if (!address) {
      this.socket.end();
      return true;
    }

    this.destination = address;
    this.protocol = data[0];

    let response: number[] = [0x05, 0x00, 0x00];
    const binaryAddress = Address.toBinary(this.source);

    response = response.concat(binaryAddress);

    this.socket.write(Buffer.from(response));

    this.isRouted = true;
    return (this.isVerified = true);
  }
}
