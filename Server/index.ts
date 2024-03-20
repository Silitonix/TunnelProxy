import { Server } from "./Server";


const argPort: string = process.argv[ 2 ];

if (!argPort)
{
  throw "need more argument";
}

let port: number = Number(argPort);

if (!port || port > 0xFFFF)
{
  throw "invalid port";
}

new Server({
  port: port,
});