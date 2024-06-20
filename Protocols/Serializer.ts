import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Serializer extends Tunnel {
  constructor(gateway: ITunnel) {
    super(gateway);
  }

  async write(...packets: Packet[]): Promise<void> {
    const serialized = packets.map((packet) => {
      packet.data = packet.serialized;
      return packet;
    });
    console.log("serialized : ",serialized);
    
    this._gateway.write(...serialized);
  }
}
