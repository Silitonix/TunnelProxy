import { Address } from "../Library/Address";
import { Packet } from "../Library/Packet";
import { Tunnel, type ITunnel } from "../Library/Tunnel";

export class HTTPClient extends Tunnel {
  remote: Address;
  constructor(gateway: ITunnel, address: Address) {
    super(gateway);
    this.remote = address;
  }

  async write(...packets: Packet[]): Promise<void> {
    const response = await fetch(this.remote.hostname, {
      body: Packet.serialize(...packets),
      method: "POST"
    });
    if (response.body === null) return;
    const string = response.body.toString();
    const newPacket = Packet.deserialize(string);
    this._gateway.write(...newPacket);
  }
}
