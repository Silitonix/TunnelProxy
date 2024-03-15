import { Socket } from "bun";
import { TCPSocketConnectOptions } from "bun";

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
  forward()
  {

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
        hostname: this.hostname,
        port: this.port,
        socket: {
          open: this.open.bind(this),
          data: this.data.bind(this),
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
    this.write(0x00, 0x00, ...this.binaryAddr);
    this.isConnected = true;
  }

  data(socket: Socket, data: Buffer): void // message received from client
  {
    this.client.write(data);
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