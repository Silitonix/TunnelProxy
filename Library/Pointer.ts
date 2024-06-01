import type { Socket } from "bun";

export class Pointer {
  static keys: Map<number, any>;
  static values: Map<any, number>;

  static {
    this.keys = new Map();
    this.values = new Map();
  }

  static from(pointer: any): number {
    if (this.values.has(pointer)) {
      return this.values.get(pointer) ?? 0;
    }
    const id = performance.now() | 0;
    this.values.set(pointer, id);
    this.keys.set(id, pointer);
    return id;
  }

  static to<T>(pointer: any): T {
    return this.keys.get(pointer.id);
  }
}
