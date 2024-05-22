import type { ITunnel } from "./Tunnel";

export interface Connection extends ITunnel
{
  close():void
}