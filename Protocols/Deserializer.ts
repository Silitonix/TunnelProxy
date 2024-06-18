import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class Deserializer extends Tunnel {
  disolve: boolean;
  constructor(gateway: ITunnel, disolve: boolean = false) {
    super(gateway);
    this.disolve = disolve;
  }
  async write(...packets: Packet[]): Promise<void> {
    const newPackets: Packet[] = [];
    packets.forEach((packet) => {
      const extract = Packet.deserialize(packet.data.toString());
      newPackets.push(...extract);

      extract.map((pack) => {
        if (this.disolve) pack.destination.socket.pop();
        else pack.destination.socket.push(-1);
        console.log(pack);
        
        pack.source.socket.push(...packet.source.socket);
        return pack;
      });
    });
    this._gateway.write(...newPackets);
  }
}
