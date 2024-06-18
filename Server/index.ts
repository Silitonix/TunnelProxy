import { BunTCPServer } from "../Connections/BunTCPServer";
import { Address } from "../Library/Address";
import { Deserializer } from "../Protocols/Deserializer";
import { Serializer } from "../Protocols/Serializer";
import { TCPClient } from "../Protocols/TCPClient";
import { DefaultTemplate } from "../Templates/Default";

const addrListen = new Address("0.0.0.0", 42069);

const socket = new BunTCPServer(addrListen, DefaultTemplate);
// const serializer = new Serializer(socket);
const direct = new TCPClient(socket);
// const deserializer = new Deserializer(direct);

socket.listen(direct);
