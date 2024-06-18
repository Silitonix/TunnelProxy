import { BunTCPServer } from "../Connections/BunTCPServer";
import { Address } from "../Library/Address";
import type { Packet } from "../Library/Packet";
import { Deserializer } from "../Protocols/Deserializer";
import { Router } from "../Protocols/Router";
import { Serializer } from "../Protocols/Serializer";
import { Socks5Server } from "../Protocols/Socks5";
import { TCPClient } from "../Protocols/TCPClient";
import { Socks5Template } from "../Templates/Socks5";

const addrListen = new Address("127.0.0.1", 6969);
const addrGateway = new Address("127.0.0.1", 42069);

const socket = new BunTCPServer(addrListen, Socks5Template);
const direct = new TCPClient(socket);
const deserializer = new Deserializer(socket,true);
const redirected = new TCPClient(deserializer);
const serializer = new Serializer(redirected, addrGateway);

const router = new Router(direct, {
  tunnel: serializer,
  verify: (packet: Packet) => {
    const addr = packet.destination.hostname;
    const domain = addr.split(".");
    const tld = domain.at(-1);
    return !(tld == "ir" || addr == "127.0.0.1")
  },
});

const socks5 = new Socks5Server(router);

socket.listen(socks5);
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
import type { Socket } from "bun";
import { SocketServer, type SocketClass } from "../Library/Socket";
import { Tunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Packet } from "../Library/Packet";
import { Address } from "../Library/Address";
import type { SocketTemplate } from "../Library/Template";

export class BunTCPServer<T extends SocketTemplate> extends SocketServer {
  blueprint: SocketClass<T>;
  private _gateway?: Tunnel;
  constructor(source: Address, blueprint: SocketClass<T>) {
    super(source);
    this.blueprint = blueprint;
  }
  write(...packets: Packet[]): void {
    packets.forEach((packet) => {
      const pointer = packet.source.activeSocket;
      const socket = Pointer.to(pointer) as Socket;
      socket.write(packet.data);
    });
  }

  listen(gateway: Tunnel): void {
    this._gateway = gateway;
    Bun.listen<T>({
      hostname: this.source.hostname,
      port: this.source.port,
      socket: {
        open: this.open.bind(this),
        data: this.data.bind(this),
        error: this.error.bind(this),
        close: this.close.bind(this),
      },
    });
    console.log("Listenning on %s:%s", this.source.hostname, this.source.port);
  }

  open(socket: Socket<T>): void {
    const pointer = Pointer.from(socket);
    const source = this.source.clone;
    source.socket.push(pointer);

    socket.data = new this.blueprint(source, Address.empty);
  }

  data(socket: Socket<T>, data: Buffer): void {
    const destination = socket.data.destination;
    const source = socket.data.source;

    const packet = new Packet(data, source, destination);
    this._gateway?.write(packet);
  }
  close(socket: Socket<T>) {
    Pointer.delete(socket);
  }

  error(socket: Socket<T>, error: Error): void {
    socket.end();
    console.log(error);
  }
}
export class Address {
  hostname: string;
  port: number;
  socket: number[] = [];
  static get empty() {
    return new Address("", 0);
  }

  constructor(hostname: string, port: number = 80, ...socket: number[]) {
    this.hostname = hostname;
    this.port = port;
    this.socket.push(...socket);
  }
  static clone(address: Address) {
    const clone = new Address(
      address.hostname,
      address.port,
      ...address.socket
    );
    return clone;
  }
  get isBinded() {
    return this.socket.length < 1 || this.activeSocket < 0;
  }
  get activeSocket() {
    return this.socket[this.socket.length - 1];
  }
  set activeSocket(value: number) {
    this.socket[this.socket.length - 1] = value;
  }
  get clone() {
    return new Address(this.hostname, this.port, ...this.socket);
  }
  //#region converter
  static fromBinary(data: number[]): Address | undefined {
    const addrType = data[0];

    type parser = { [key: number]: (data: number[]) => string };
    const parsers: parser = {
      0x01: this.parseIPv4,
      0x03: this.parseDomain,
      0x04: this.parseIPv6,
    };

    const parser = parsers[addrType];
    if (!parser) return undefined;

    const hostname = parser(data);
    const port = this.parsePort(data, addrType, hostname.length);
    return new Address(hostname, port);
  }

  static toBinary(address: Address): number[] {
    let binaryData: number[] = [];

    const addrType = this.type(address.hostname);

    binaryData.unshift(addrType);

    if (addrType === 0x01) {
      binaryData = binaryData.concat(this.ipv4ToBinary(address));
    } else if (addrType === 0x04) {
      binaryData = binaryData.concat(this.ipv6ToBinary(address));
    } else {
      binaryData = binaryData.concat(this.domainToBinary(address));
    }

    binaryData.push((address.port >> 8) & 0xff);
    binaryData.push(address.port & 0xff);

    return binaryData;
  }

  static domainToBinary(address: Address): number[] {
    let binaryData: number[] = [];
    const domainLength = address.hostname.length;
    binaryData.push(domainLength);
    for (let i = 0; i < domainLength; i++) {
      binaryData.push(address.hostname.charCodeAt(i));
    }
    return binaryData;
  }

  static ipv4ToBinary(address: Address): number[] {
    return address.hostname.split(".").map((part) => parseInt(part, 10));
  }

  static ipv6ToBinary(address: Address): number[] {
    let binaryData: number[] = [];
    const parts = address.hostname.split(":");
    parts.forEach((part) => {
      const hex = parseInt(part, 16);
      binaryData.push((hex >> 8) & 0xff);
      binaryData.push(hex & 0xff);
    });
    return binaryData;
  }
  //#endregion
  //#region helper
  static type(hostname: string): number {
    if (this.isIPv4(hostname)) return 0x01;
    if (this.isIPv6(hostname)) return 0x04;
    return 0x03;
  }

  static isIPv4(hostname: string): boolean {
    return /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  }

  static isIPv6(hostname: string): boolean {
    return /^[0-9a-fA-F:]+$/.test(hostname);
  }

  //#endregion
  //#region parsers
  static parseIPv4(data: number[]): string {
    const addrLength = 4;
    return data.slice(1, 1 + addrLength).join(".");
  }

  static parseDomain(data: number[]): string {
    const addrLength = data[1];
    return String.fromCharCode(...data.slice(2, 2 + addrLength));
  }

  static parseIPv6(data: number[]): string {
    const addrLength = 16;
    return data
      .slice(1, 1 + addrLength)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(":");
  }

  static parsePort(
    data: number[],
    addrType: number,
    addrLength: number
  ): number {
    const portIndex = 1 + (addrType === 0x03 ? 1 + addrLength : addrLength);
    return (data[portIndex] << 8) | data[portIndex + 1];
  }
  //#endregion
}
import { Address } from "./Address";

export class Packet {
  destination: Address;
  source: Address;
  data: Buffer;

  constructor(data: Buffer, source: Address, destination: Address) {
    this.data = data;
    this.source = source;
    this.destination = destination;
  }
  get clone() {
    return structuredClone(this);
  }

  static readonly emptyBuffer = Buffer.from([]);
  static serialize(...packets: Packet[]): string {
    const output: string[] = [];
    packets.forEach((packet) => {
      const data = [
        btoa(JSON.stringify(packet.source)),
        btoa(JSON.stringify(packet.destination)),
        packet.data.toString("base64"),
      ];
      output.push(data.join(","));
    });

    return output.join("|");
  }

  static deserialize(serialized: string): Packet[] {
    const packets: Packet[] = [];
    serialized.split("|").forEach((packet) => {
      const [src, dst, ...dataArray] = packet.split(",");
      const dataString = dataArray.join(",");

      const dstObj = JSON.parse(atob(dst));
      const srcObj = JSON.parse(atob(src));

      const destination = Address.clone(dstObj);
      const source = Address.clone(srcObj);

      packets.push(
        new Packet(Buffer.from(dataString, "base64"), source, destination)
      );
    });
    return packets;
  }
}
export class Pointer {
  static keys: Map<number, any>;
  static values: Map<any, number>;
  static counter = 0;
  static {
    this.keys = new Map();
    this.values = new Map();
  }

  static from(value: any): number {
    if (this.values.has(value)) {
      const id = this.values.get(value);
      if (id === undefined) {
        throw "Error : socket not found";
      }
      return id;
    }

    const id = ++this.counter;
    this.values.set(value, id);
    this.keys.set(id, value);
    
    return id;
  }

  static to<T>(pointer: number): T {
    return this.keys.get(pointer);
  }

  static delete(Unknown: any) {
    if (typeof Unknown == "number") {
      const value = this.keys.get(Unknown);
      if (!value) return;
      this.values.delete(value);
      this.keys.delete(Unknown);
    } else {
      const pointer = this.values.get(Unknown);
      if (!pointer) return;
      this.keys.delete(pointer);
      this.values.delete(Unknown);
    }
  }
}
import type { Socket } from "bun";
import type { Address } from "./Address";
import type { Packet } from "./Packet";
import type { ITunnel, Tunnel } from "./Tunnel";

export type SocketClass<T> = new (source: Address, destination: Address) => T;
export interface ISocketServer {
  listen(gateway: Tunnel): void;
}

export abstract class SocketServer implements ISocketServer, ITunnel {
  source: Address;

  constructor(source: Address) {
    this.source = source;
  }
  write(...packets: Packet[]): void {
    throw new Error("Method not implemented.");
  }
  listen(gateway: Tunnel): void {
    throw new Error("Method not implemented.");
  }
}
import type { Socket } from "bun";
import type { Address } from "./Address";

export class SocketTemplate {
  source: Address;
  destination: Address;
  constructor(source: Address, destination: Address) {
    this.source = source;
    this.destination = destination;
  }
}
import type { Packet } from "./Packet";

export interface ITunnel {
  write(...packets: Packet[]): void;
}

export abstract class Tunnel implements ITunnel {
  protected _gateway: ITunnel;
  constructor(gateway: ITunnel) {
    this._gateway = gateway;
  }

  async write(...packets: Packet[]): Promise<void> {}
}
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Deserializer extends Tunnel {
  disolve: boolean;
  constructor(gateway: ITunnel, disolve: boolean = false) {
    super(gateway);
    this.disolve = disolve;
  }
  async write(...packets: Packet[]): Promise<void> {
    const newPackets: Packet[] = [];
    packets.forEach((packet) => {
      const extract = Packet.deserialize(packet.data.toString());
      newPackets.push(...extract);

      extract.map((pack) => {
        if (this.disolve) pack.destination.socket.pop();
        else pack.destination.socket.push(-1);
        
        pack.source.socket.push(...packet.source.socket);
        return pack;
      });
    });
    this._gateway.write(...newPackets);
  }
}
import { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class HTTPRedirect extends Tunnel {
  remote: Address;
  constructor(gateway: ITunnel, address: Address) {
    super(gateway);
    this.remote = address;
  }

  async write(...packets: Packet[]): Promise<void> {
    try {
      const response = await fetch(this.remote.hostname, {
        body: Packet.serialize(...packets),
        method: "POST",
      });
      if (response.body === null) return;
      const string = response.body.toString();
      const newPacket = Packet.deserialize(string);
      this._gateway.write(...newPacket);
    } catch (error) {
      console.log(error);
    }
  }
}
import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

interface IRouter {
  tunnel: ITunnel;
  verify: (packet: Packet) => boolean;
}

export class Router extends Tunnel {
  private _gateways: IRouter[];
  constructor(gateway: ITunnel, ...gateways: IRouter[]) {
    super(gateway);
    this._gateways = gateways;
  }
  async write(...packets: Packet[]): Promise<void> {
    packets.forEach((packet) => {
      for (let i = 0; i < this._gateways.length; i++) {
        const gateway = this._gateways[i];
        if (gateway.verify(packet)) {
          gateway.tunnel.write(packet);
          return;
        }
      }
      this._gateway.write(packet);
    });
  }
}
import type { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Serializer extends Tunnel {
  target?: Address;
  disolve: boolean;

  constructor(gateway: ITunnel, target?: Address, disolve: boolean = false) {
    super(gateway);
    this.target = target;
    this.disolve = disolve;
  }
  async write(...packets: Packet[]): Promise<void> {
    packets.forEach((packet, i) => {
      const newPacket = packet.clone;
      if (this.target) {
        newPacket.destination = this.target;
      }
      const pack = Packet.serialize(packet);
      newPacket.data = Buffer.from(pack);

      packets[i] = newPacket;
    });
    this._gateway.write(...packets);
  }
}
import type { Socket } from "bun";
import type { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { Socks5Template } from "../Templates/Socks5";

export class Socks5Server extends Tunnel {
  constructor(gateway: ITunnel) {
    super(gateway);
  }

  async write(...packets: Packet[]): Promise<void> {
    packets.forEach(packet => {
      const socket: Socket<Socks5Template> = Pointer.to(packet.source.activeSocket);

      const verify = socket.data.verify(packet.data);
      if (verify == false) {
        return;
      }
      packet.destination = socket.data.destination;
  
      this._gateway.write(packet);
    });
  }
}
import type { Socket } from "bun";
import type { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";
import { Pointer } from "../Library/Pointer";
import { DefaultTemplate } from "../Templates/Default";

export class TCPClient extends Tunnel {
  remote?: Address;
  constructor(gateway: ITunnel, address?: Address) {
    super(gateway);
    this.remote = address;
  }

  connect(packet: Packet) {
    const destination = this.remote ?? packet.destination;
    Bun.connect<DefaultTemplate>({
      hostname: destination.hostname,
      port: destination.port,
      socket: {
        open(socket) {
          const pointer = Pointer.from(socket);
          packet.destination.socket.push(pointer);
          socket.data = new DefaultTemplate(packet.source, packet.destination);
          socket.write(packet.data);
        },
        data: this.data.bind(this),
        error: this.close,
        close: this.close,
        connectError: this.close,
      },
    });
  }

  async write(...packets: Packet[]): Promise<void> {
    packets.forEach((packet) => {
      const socket = Pointer.to(packet.destination.activeSocket) as Socket<DefaultTemplate>;

      if (socket == undefined) {
        this.connect(packet);
        return;
      }

      socket.write(packet.data);
    });
  }

  data(socket: Socket<DefaultTemplate>, data: Buffer) {
    const packet = new Packet(
      data,
      socket.data.source,
      socket.data.destination
    );
    this._gateway.write(packet);
  }
  close(socket: Socket<Packet>) {
    Pointer.delete(socket);
  }
}
import { BunTCPServer } from "../Connections/BunTCPServer";
import { Address } from "../Library/Address";
import { Deserializer } from "../Protocols/Deserializer";
import { Serializer } from "../Protocols/Serializer";
import { TCPClient } from "../Protocols/TCPClient";
import { DefaultTemplate } from "../Templates/Default";

const addrListen = new Address("127.0.0.1", 42069);

const socket = new BunTCPServer(addrListen, DefaultTemplate);
const serializer = new Serializer(socket);
const direct = new TCPClient(serializer);
const deserializer = new Deserializer(direct);

socket.listen(deserializer);
import { SocketTemplate } from "../Library/Template";

export class DefaultTemplate extends SocketTemplate {
  
}
import type { Socket } from "bun";
import { SocketTemplate } from "../Library/Template";
import { Socks5Command } from "./Socks5Command";
import { Address } from "../Library/Address";
import { Pointer } from "../Library/Pointer";

export class Socks5Template extends SocketTemplate {
  isGreeted: boolean = false;
  isAuthorized: boolean = false;
  isRouted: boolean = false;
  isVerified: boolean = false;
  protocol: Socks5Command = Socks5Command.TCPBind;
  binaryAddress?: Buffer;
  socket: Socket<SocketTemplate>;

  constructor(source: Address, destination: Address) {
    super(source, destination);
    const socket = Pointer.to(source.activeSocket) as Socket<SocketTemplate>;
    this.socket = socket;
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
export enum Socks5Command
{
  TCPStream,
  TCPBind,
  UDP
}
