import "@testing-library/jest-dom/vitest";

// This jsdom build doesn't provide Web Storage (opaque origin). Provide a small
// in-memory implementation so key-store behaviour can be tested for real.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null;
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  if (!window[name]) {
    Object.defineProperty(window, name, { value: new MemoryStorage(), configurable: true });
  }
}
