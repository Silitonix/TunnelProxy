import { Conn } from "./Conn";
import { Socket } from "bun";
import { TCPSocketListenOptions } from "bun";

interface Props
{
  hostname?: string;
  port?: number;
}

export class Client
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
  
  initialize(hostname: string = '127.0.0.1', port: number = 9999): void
  {
    const options: TCPSocketListenOptions<Conn> = {
      hostname: hostname,
      port: port,
      socket: {
        open: this.open.bind(this),
        data: this.data.bind(this),
        close: this.close.bind(this),
        drain: this.drain.bind(this),
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

    const [ version, ...message ] = Array.from(data);
    if (!conn.isGreeted)
    {
      if (version != Conn.Version)
      {
        const response = Buffer.from([ 0xFF ]);
        socket.end(response);
      }

      conn.greeting(message);
      return;
    }

    conn.connect(message);
  }
  close(socket: Socket<Conn>): void // socket closed
  { }
  drain(socket: Socket<Conn>): void // socket ready for more data
  { }
  error(socket: Socket<Conn>, error: Error): void // error handler
  { }
}