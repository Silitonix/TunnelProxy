import { Socket } from "bun";
import { TCPSocketConnectOptions } from "bun";
import { Client } from "./Client";

interface Props
{
  client: Socket<Conn>;
}

interface CMD
{
}

export class Conn
{
  static Version = 0x05;

  client: Socket<Conn>;
  server: Socket;

  isGreeted: boolean = false;
  isClientHello: boolean = true;
  isConnected: boolean = false;
  isRerouting: boolean = false;

  binaryAddr: number[];
  hostname: string;
  port: number;

  constructor (props: Props)
  {
    this.client = props.client;
  }

  //  ** Socks5 Proxy greeting **
  greeting(data: number[])
  {
    const [ numAuth, ...auth ] = data;
    if (!auth.includes(0))
    {
      this.end(0xFF);
    }

    this.isGreeted = true;
    this.write(0x00);
  }

  async forward(data: Buffer)
  {
    //  TODO Fragment tls client hello

    // if (conn.isClientHello)
    // {
    //   let clientHello = data.toString().split('.');
    //   for (let i = 0; i < clientHello.length; i++)
    //   {
    //     const chunk = clientHello[ i ];
    //     conn.server.write(`${ chunk }${ i >= clientHello.length - 1 ? '.' : '' }`);
    //     await Bun.sleep(100);
    //   }
    //   conn.isClientHello = false;

    //   return;
    // }

    this.server.write(data.reverse());
  }
  // ** Socks5 Client request for connection **
  connect(data: number[])
  {
    const [ command, , ...binaryAddress ] = data;
    const [ type, ...hostnamePort ] = binaryAddress;

    this.binaryAddr = binaryAddress;
    this.computeAddr(type, hostnamePort);

    try
    {
      Bun.connect({
        hostname: Client.serverHostname,
        port: Client.serverPort,
        socket: {
          open: this.open.bind(this),
          data: this.data.bind(this),
          drain: this.drain.bind(this),
          close: this.close.bind(this),
          // error: this.error.bind(this),
        }
      });
    }
    catch (error)
    {
      console.error(`Create connection faild : ${ this.hostname }:${ this.port }`);
    }
  }

  computeAddr(type: number, hostPort: number[])
  {
    // last two byte of message is the port
    const binaryPort = hostPort.slice(hostPort.length - 2);
    const binaryHost = hostPort.slice(0, hostPort.length - 2);

    // Big endian convert
    this.port = binaryPort[ 0 ] << 8 | binaryPort[ 1 ];

    //  IPV4
    if (type == 0x01)
    {
      this.hostname = binaryHost.join('.');
      return;
    }

    // DOMAIN
    if (type == 0x03)
    {
      const chars = binaryHost.slice(1);
      this.hostname = String.fromCharCode(...chars);
      return;
    }

    //  IPV6
    if (type == 0x04)
    {
      const hexString = [];
      for (let i = 0; i < 16; i += 2)
      {
        const number = (binaryHost[ i ] << 8) | binaryHost[ i + 1 ];
        hexString.push(number.toString(16).padStart(4, '0'));
      }

      const ipv6String = hexString.join(':');

      this.hostname = ipv6String.slice(0, -1);
      return;
    }
  }


  // ** HANDLERS **
  //
  //  Socket function for bun TCP connection options
  //
  open(socket: Socket): void // socket opened
  {
    this.server = socket;
    this.forward(Buffer.from(`${ this.hostname }:${ this.port }`));
  }

  drain(socket: Socket): void // socket ready for more data
  {
  }

  data(socket: Socket, data: Buffer): void // message received from client
  {
    if (!this.isConnected && data[ 0 ] == 0x00)
    {
      this.write(0x00, 0x00, ...this.binaryAddr);
      this.isConnected = true;
      return;
    }

    this.client.write(data.reverse());
  }

  close(socket: Socket): void // socket closed
  {
    this.client.end();
  }
  error(socket: Socket, error: Error): void // error handler
  {
  }

  write(...data: number[])
  {
    const response = Buffer.from([ Conn.Version, ...data ]);
    this.client.write(response);
  }
  end(...data: number[])
  {
    const response = Buffer.from([ Conn.Version, ...data ]);
    this.client.end(response);
  }
}