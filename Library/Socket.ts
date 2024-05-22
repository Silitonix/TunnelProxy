import type { ITunnel } from "./Tunnel";

export interface ISocket
{
  bind(tunnel: ITunnel): void;
  listen(hostname: string, port: number): void;
}