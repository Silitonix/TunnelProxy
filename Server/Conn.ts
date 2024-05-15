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
  isConnected: boolean = false;

  constructor (props: Props)
  {
    this.client = props.client;
  }

  //  ** Custom proxy protocol **
  greeting(data: string)
  {
    const [ hostname, port ] = data.split(String.fromCharCode(0));
    const portnum: number = Number(port);

    if (!portnum)
    {
      this.client.end();
      return;
    }

    try
    {
      Bun.connect({
        hostname: hostname,
        port: portnum,
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
      console.error(`Create connection faild : ${ hostname }:${ port }`);
      this.client.end();
      this.server.end();
    }
  }

  forward(data: Buffer)
  {
    this.server.write(data);
  }

  // ** HANDLERS **
  //
  //  Socket function for bun TCP connection options
  //
  open(socket: Socket): void // socket opened
  {
    this.server = socket;
    this.isConnected = true;
    this.client.write(Buffer.from([ 0x00 ]));
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
}