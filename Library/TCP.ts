import type { Socket } from "bun";
export type SocketClass<Type> = new (socket:Socket<Type>) => Type;
