export type SocketClass<Type> = new (...any: any[]) => Type;
export interface ISocket {
  listen(hostname: string, port: number): void;
}
