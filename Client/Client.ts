import { HTTPClient } from "../Library/HTTP";
import { SocksConn, SocksServer } from "../Library/Socks";
import { BunTCP } from "../Library/Bun";

const socket = new BunTCP(SocksConn);
const socks = new SocksServer();
const gateway = new HTTPClient("privacy.silitonix.ir", 80);

socket.bind(socks)
socket.listen("localhost", 10808);
