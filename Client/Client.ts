interface Props
{
  hostname?: string;
  port?: number;
}

class Client
{
  constructor (props?: Props)
  {
    Bun.listen({
      hostname: props?.hostname ?? '127.0.0.1',
      port: props?.port ?? 9999,
      socket: {}
    });
  }
}