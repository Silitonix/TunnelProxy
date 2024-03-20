import { Conn } from "./Conn";
import { Socket } from "bun";
import { TCPSocketListenOptions } from "bun";

interface Props
{
  hostname: string;
  port: number;
}

export class Client
{
  static version = 0x05;
  static serverHostname: string;
  static serverPort: number;

  hostname: string = '127.0.0.1';
  port: number = 9999;

  constructor (props: Props)
  {
    Client.serverHostname = props.hostname;
    Client.serverPort = props.port;
    this.initialize();
  }

  // ** FORWARDER **
  //
  //  make a server to deliver the Packet
  //  from clinet-side into the server behind
  //  firewalls with encrypted connection
  //

  initialize(): void
  {
    const options: TCPSocketListenOptions<Conn> = {
      hostname: '127.0.0.1',
      port: 9999,
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
      console.log(`Proxy SOCKS5 Started [${ this.hostname }:${ this.port }]`);
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