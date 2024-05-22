
import type { ISocket } from "./Socket";
import type { Connection } from "./Connection";
import type { ITunnel } from "./Tunnel";
import type { SocketClass } from "./TCP";
import type { Socket } from "bun";

export class BunTCP<Type extends Connection> implements ISocket
{

  private _hostname: string;
  private _port: number;
  private tunnel?: ITunnel;

  get hostname() { return this._hostname }
  get port() { return this._port }

  blueprint: SocketClass<Type>;

  constructor(blueprint: SocketClass<Type>)
  {
    this._hostname = "";
    this._port = 0;
    this.blueprint = blueprint;
  }

  bind(tunnel: ITunnel)
  {
    this.tunnel = tunnel;
  }

  listen(hostname: string, port: number)
  {
    this._hostname = hostname;
    this._port = port;

    Bun.listen<Type>({
      hostname: this._hostname,
      port: this._port,
      socket: {
        open: this.open.bind(this),
        data: this.data.bind(this)
      },
    });
  }

  open(socket: Socket<Type>)
  {
    socket.data = new this.blueprint(socket);
  }
  data(socket: Socket<Type>, data: Buffer)
  {
    if (!this.tunnel)
    {
      return;
    }
    this.tunnel.write(data);
  }
}