import { BunTCPServer } from "../Connections/BunTCPServer";
import { Address } from "../Library/Address";
import { HTTPClient } from "../Protocols/HTTPClient";
import { Router } from "../Protocols/Router";
import { Socks5Server } from "../Protocols/Socks5";
import { Socks5Template } from "../Templates/Socks5";

const addrListen = new Address("127.0.0.1", 6969);
const addrGateway = new Address("https://change.silitonix.ir");

const socket = new BunTCPServer(addrListen, Socks5Template);
const http = new HTTPClient(socket, addrGateway);
const router = new Router(http);
const socks5 = new Socks5Server(router);

socket.listen(socks5);
