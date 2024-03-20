import { Client } from "./Client";

const argHostname: string = process.argv[ 2 ];
const argPort: string = process.argv[ 3 ];


if (!argHostname || !argPort)
{
  throw "need more argument";
}

let port: number = Number(argPort);

if (!port || port > 0xFFFF)
{
  throw "invalid port";
}

new Client({
  port: port,
  hostname: argHostname
});