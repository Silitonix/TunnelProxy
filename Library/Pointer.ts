export class Pointer {
  static keys: Map<number, any>;
  static values: Map<any, number>;
  static counter = 0;
  static {
    this.keys = new Map();
    this.values = new Map();
  }

  static from(value: any): number {
    if (this.values.has(value)) {
      const id = this.values.get(value);
      if (id === undefined) {
        throw "Error : socket not found";
      }
      return id;
    }

    const id = ++this.counter;
    this.values.set(value, id);
    this.keys.set(id, value);
    
    return id;
  }

  static to<T>(pointer: number): T {
    return this.keys.get(pointer);
  }
}