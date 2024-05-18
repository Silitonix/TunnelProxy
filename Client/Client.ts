import { HTTPClient } from "../Library/HTTP";
import { SocksServer } from "../Library/Socks";
import { BunTCP } from "../Library/TCP";

const gateway = new HTTPClient("privacy.silitonix.ir",80);
const socks = new SocksServer(gateway);
const socket = new BunTCP(socks);
