export interface Connection
{
  write(data: Buffer): void
  close():void
}