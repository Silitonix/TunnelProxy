import { Conn } from "./Conn";
import { Socket } from "bun";
import { TCPSocketListenOptions } from "bun";

interface Props
{
  hostname?: string;
  port?: number;
}

export class Server
{
  static version = 0x05;

  constructor (props?: Props)
  {
    this.initialize(props?.hostname, props?.port);
  }

  // ** FORWARDER **
  //
  //  make a server to deliver the Packet
  //  from clinet-side into the server behind
  //  firewalls with encrypted connection
  //

  initialize(hostname: string = '0.0.0.0', port: number = 10000): void
  {
    const options: TCPSocketListenOptions<Conn> = {
      hostname: hostname,
      port: port,
      socket: {
        open: this.open.bind(this),
        data: this.data.bind(this),
        close: this.close.bind(this),
        error: this.error.bind(this),
      }
    };

    try
    {
      Bun.listen<Conn>(options);
      console.log(`Proxy SOCKS5 Started [${ hostname }:${ port }]`);
    }
    catch (error)
    {
      console.error(`Create server faild ${ error }`);
      process.exit(1);
    }
  };

  // ** HANDLERS **
  //
  //  Socket function for bun TCP server options
  //

  open(socket: Socket<Conn>): void // socket opened
  {
    socket.data = new Conn({ client: socket });
  }

  data(socket: Socket<Conn>, data: Buffer): void // message received from client
  {
    const conn = socket.data;

    if (conn.isConnected)
    {
      conn.forward(data);
      return;
    }

    conn.greeting(data.toString());
    return;
  }
  close(socket: Socket<Conn>): void // socket closed
  { }
  error(socket: Socket<Conn>, error: Error): void // error handler
  { }
}