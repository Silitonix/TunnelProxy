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

    const cmd = data[0];
    const addrType = data[3];
    let addrLength = 0;
    let hostname: string = "";

    switch (addrType) {
      case 0x01: // IPv4
        addrLength = 4;
        hostname = data.slice(4, 4 + addrLength).join(".");
        break;
      case 0x03: // Domain name
        addrLength = data[4];
        hostname = String.fromCharCode(...data.slice(5, 5 + addrLength));
        break;
      case 0x04: // IPv6
        addrLength = 16;
        hostname = data
          .slice(4, 4 + addrLength)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(":");
        break;
      default:
        this.socket.end();
        return;
    }

    const portIndex = 4 + (addrType === 0x03 ? 1 + addrLength : addrLength);
    const port = (data[portIndex] << 8) | data[portIndex + 1];

    this.destination = new Address(hostname, port);

    this.protocol = cmd;

    this.isRouted = true;
    this.isVerified = true;

    let response: number[] = [0x05, 0x00, 0x00]; // VER, REP, RSV
    response.push(0x01); // ATYP for IPv4

    // Add bound address (IPv4)
    response = response.concat(this.source.hostname.split(".").map(Number));

    // Add bound port
    response.push((this.source.port >> 8) & 0xff);
    response.push(this.source.port & 0xff);

    this.socket.write(Buffer.from(response));
  }
}
