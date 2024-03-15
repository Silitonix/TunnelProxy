import { Conn } from "./Conn";
import { Socket } from "bun";
import { TCPSocketListenOptions } from "bun";

interface Props
{
  hostname?: string;
  port?: number;
}

class Client
{
  constructor (props?: Props)
  {
    const { hostname, port } = props;
    this.initialize(hostname, port);
  }

  // ** FORWARDER **

  //  make a server to deliver the
  //  Packet from clinet-side into
  //  the server behind firewalls.

  initialize(hostname: string = '127.0.0.1', port: number = 9999): void
  {
    const options: TCPSocketListenOptions<Conn> = {
      hostname: hostname,
      port: port,
      socket: {}
    };

    try { Bun.listen<Conn>(options); }
    catch (error)
    {
      console.error("Create server faild");
      process.exit(1);
    }
  }

  // ** HANDLERS **

  //  Socket function for bun options

  open(socket: Socket<Conn>)
  {
  }
}