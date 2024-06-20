import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Deserializer extends Tunnel {
  increamental: boolean;
  constructor(gateway: ITunnel, increamental: boolean = true) {
    super(gateway);
    this.increamental = increamental;
  }

  async write(...packets: Packet[]): Promise<void> {
    const deserialized = packets.map((packet) => {
      const newPacket = packet.deserialized;
      if (this.increamental) {
        newPacket.source.socket.push(packet.source.activeSocket);
      } else {
        newPacket.source.socket.pop();
      }
      return newPacket;
    });
    console.log("deserialized : ", deserialized);

    this._gateway.write(...deserialized);
  }
}
