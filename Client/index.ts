import { BunTCPServer } from "../Connections/BunTCPServer";
import { Address } from "../Library/Address";
import type { Packet } from "../Library/Packet";
import { Deserializer } from "../Protocols/Deserializer";
import { Router } from "../Protocols/Router";
import { Serializer } from "../Protocols/Serializer";
import { Socks5Server } from "../Protocols/Socks5";
import { TCPClient } from "../Protocols/TCPClient";
import { Socks5Template } from "../Templates/Socks5";

const addrListen = new Address("127.0.0.1", 6969);
const addrGateway = new Address("127.0.0.1", 42069);

const socket = new BunTCPServer(addrListen, Socks5Template);
const direct = new TCPClient(socket);
// const deserializer = new Deserializer(socket,true);
const redirected = new TCPClient(socket);
// const serializer = new Serializer(redirected, addrGateway);

const router = new Router(direct, {
  tunnel: redirected,
  verify: (packet: Packet) => {
    const addr = packet.destination.hostname;
    const domain = addr.split(".");
    const tld = domain.at(-1);
    return !(tld == "ir" || addr == "127.0.0.1")
  },
});

const socks5 = new Socks5Server(router);

socket.listen(socks5);
