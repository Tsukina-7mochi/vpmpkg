import { crypto } from 'crypto';
import { encodeHex } from 'encoding/hex.ts';
import * as fs from 'fs';
import * as posix from 'path/posix/mod.ts';

const textEncoder = new TextEncoder();

const hashText = function (text: string): Promise<string> {
  const encoded = textEncoder.encode(text);
  return crypto.subtle.digest('SHA-256', encoded)
    .then((hashed) => {
      return encodeHex(hashed);
    });
};

interface CustomCache<T> {
  get(cacheName: string): T | null;
  getOrElse(cacheName: string, defaultFunc: () => T | Promise<T>): Promise<T>;
  set(cacheName: string, content: T): void;
  clean(): void | Promise<void>;
}

interface AsyncCustomCache<T> {
  get(cacheName: string): Promise<T | null>;
  getOrElse(cacheName: string, defaultFunc: () => T | Promise<T>): Promise<T>;
  set(cacheName: string, content: T): Promise<void>;
}

class DiskCache implements AsyncCustomCache<Uint8Array> {
  rootDir: string;
  ttl: number | null;

  constructor(rootDir: string, ttl?: number) {
    this.rootDir = posix.resolve(rootDir);
    this.ttl = ttl ?? null;
  }

  async get(cacheName: string): Promise<Uint8Array | null> {
    const cacheNameHashed = await hashText(cacheName);
    const cachePath = posix.join(this.rootDir, cacheNameHashed);

    try {
      const stat = await Deno.stat(cachePath);

      if (!stat.isFile) {
        return null;
      }
      if (
        this.ttl !== null && stat.birthtime !== null &&
        Date.now() - stat.birthtime.getTime() > this.ttl
      ) {
        await Deno.remove(cachePath);
        return null;
      }
      return Deno.readFile(cachePath);
    } catch {
      return null;
    }
  }

  async getOrElse(
    cacheName: string,
    defaultFunc: () => Uint8Array | Promise<Uint8Array>,
  ): Promise<Uint8Array> {
    const cached = await this.get(cacheName);

    if (cached !== null) {
      return cached;
    }

    const content = await defaultFunc();
    await this.set(cacheName, content);

    return content;
  }

  async set(cacheName: string, content: Uint8Array): Promise<void> {
    const cacheNameHashed = await hashText(cacheName);
    const cachePath = posix.join(this.rootDir, cacheNameHashed);

    await fs.ensureDir(this.rootDir);
    await Deno.writeFile(cachePath, content, { create: true });
  }

  async clean(): Promise<void> {
    for await (const dir of Deno.readDir(this.rootDir)) {
      if (!dir.isFile) {
        break;
      }
      const path = posix.join(this.rootDir, dir.name);
      const stat = await Deno.stat(path);

      if (
        this.ttl !== null && stat.birthtime !== null &&
        Date.now() - stat.birthtime.getTime() > this.ttl
      ) {
        await Deno.remove(path);
      }
    }
  }
}

class InMemoryCache<T> implements CustomCache<T> {
  values: Map<string, [T, number]>;
  ttl: number | null;

  constructor(ttl?: number) {
    this.values = new Map();
    this.ttl = ttl ?? null;
  }

  get(cacheName: string): T | null {
    const entry = this.values.get(cacheName);
    if (entry === undefined) {
      return null;
    }

    const [value, timestamp] = entry;
    if (this.ttl !== null && Date.now() - timestamp > this.ttl) {
      this.values.delete(cacheName);
      return null;
    }
    return value;
  }

  async getOrElse(
    cacheName: string,
    defaultFunc: () => T | Promise<T>,
  ): Promise<T> {
    const cached = this.get(cacheName);

    if (cached !== null) {
      return Promise.resolve(cached);
    }

    const content = await defaultFunc();
    this.set(cacheName, content);

    return content;
  }

  set(cacheName: string, content: T): void {
    this.values.set(cacheName, [content, Date.now()]);
  }

  clean(): void {
    for (const [key, [_, timestamp]] of this.values.entries()) {
      if (this.ttl !== null && Date.now() - timestamp > this.ttl) {
        this.values.delete(key);
      }
    }
  }
}

class NoCache<T> implements CustomCache<T> {
  get(): null {
    return null;
  }

  getOrElse(_cacheName: string, defaultFunc: () => T | Promise<T>): Promise<T> {
    return Promise.resolve(defaultFunc());
  }

  set(): void {
    // do nothing
  }

  clean(): void {
    // do nothing
  }
}

export type { AsyncCustomCache, CustomCache };
export { DiskCache, InMemoryCache, NoCache };
