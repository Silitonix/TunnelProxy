export class Address {
  hostname: string;
  port: number;

  constructor(hostname: string, port: number) {
    this.hostname = hostname;
    this.port = port;
  }

  static fromBinary(data: number[]): Address | undefined {
    const addrType = data[0];

    type parser = { [key: number]: (data: number[]) => string };
    const parsers: parser = {
      0x01: this.parseIPv4,
      0x03: this.parseDomain,
      0x04: this.parseIPv6,
    };

    const parser = parsers[addrType];
    if (!parser) return undefined;

    const hostname = parser(data);
    const port = this.parsePort(data, addrType, hostname.length);
    return new Address(hostname, port);
  }

  static parseIPv4(data: number[]): string {
    const addrLength = 4;
    return data.slice(1, 1 + addrLength).join(".");
  }

  static parseDomain(data: number[]): string {
    const addrLength = data[1];
    return String.fromCharCode(...data.slice(2, 2 + addrLength));
  } 

  static parseIPv6(data: number[]): string {
    const addrLength = 16;
    return data
      .slice(1, 1 + addrLength)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(":");
  }

  static parsePort(
    data: number[],
    addrType: number,
    addrLength: number
  ): number {
    const portIndex = 1 + (addrType === 0x03 ? 1 + addrLength : addrLength);
    return (data[portIndex] << 8) | data[portIndex + 1];
  }

  static toBinary(address: Address): number[] {
    let binaryData: number[] = [];

    let addrType: number;
    if (this.isIPv4(address.hostname)) {
      addrType = 0x01;
      binaryData = binaryData.concat(this.ipv4ToBinary(address));
    } else if (this.isIPv6(address.hostname)) {
      addrType = 0x04;
      binaryData = binaryData.concat(this.ipv6ToBinary(address));
    } else {
      addrType = 0x03;
      binaryData = binaryData.concat(this.domainToBinary(address));
    }

    binaryData.unshift(addrType);

    binaryData.push((address.port >> 8) & 0xff);
    binaryData.push(address.port & 0xff);

    return binaryData;
  }

  static isIPv4(hostname: string): boolean {
    return /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  }

  static isIPv6(hostname: string): boolean {
    return /^[0-9a-fA-F:]+$/.test(hostname);
  }

  static domainToBinary(address: Address): number[] {
    let binaryData: number[] = [];
    const domainLength = address.hostname.length;
    binaryData.push(domainLength);
    for (let i = 0; i < domainLength; i++) {
      binaryData.push(address.hostname.charCodeAt(i));
    }
    return binaryData;
  }

  static ipv4ToBinary(address: Address): number[] {
    return address.hostname.split(".").map((part) => parseInt(part, 10));
  }

  static ipv6ToBinary(address: Address): number[] {
    let binaryData: number[] = [];
    const parts = address.hostname.split(":");
    parts.forEach((part) => {
      const hex = parseInt(part, 16);
      binaryData.push((hex >> 8) & 0xff);
      binaryData.push(hex & 0xff);
    });
    return binaryData;
  }
}
