import { BunTCPServer } from "../Connections/BunTCPServer";
import { Address } from "../Library/Address";
import { HTTPClient } from "../Protocols/HTTPClient";
import { Socks5Server } from "../Protocols/Socks5";
import { Socks5Template } from "../Templates/Socks5";

const addrListen = new Address("127.0.0.1", 4500);
const addrGateway = new Address("silitonix.ir", 80);

const socket = new BunTCPServer(addrListen, Socks5Template);
const http = new HTTPClient(socket, addrGateway);
const socks5 = new Socks5Server(http);

socket.listen(socks5);
