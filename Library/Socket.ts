export type SocketClass<Type> = new (...any: any[]) => Type;
export interface ISocket {
  listen(hostname: string, port: number): void;
}

export interface ISocketSchema {
  verify(data: Buffer): boolean;
}
