import type { Tunnel } from "./Tunnel";

export interface Socket
{
  listen(tunnel: Tunnel): void;
}