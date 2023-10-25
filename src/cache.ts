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

class CustomCache {
  rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = posix.resolve(rootDir);
  }

  async get(cacheName: string): Promise<Uint8Array | null> {
    const cacheNameHashed = await hashText(cacheName);
    const cachePath = posix.join(this.rootDir, cacheNameHashed);

    try {
      return await Deno.readFile(cachePath);
    } catch {
      return null;
    }
  }

  async set(cacheName: string, content: string | Uint8Array): Promise<void> {
    const cacheNameHashed = await hashText(cacheName);
    const cachePath = posix.join(this.rootDir, cacheNameHashed);

    const uint8ArrayContent = ((): Uint8Array => {
      if (typeof content === 'string') {
        return textEncoder.encode(content);
      }
      return content;
    })();

    await fs.ensureDir(this.rootDir);
    await Deno.writeFile(cachePath, uint8ArrayContent, { create: true });
  }
}

export default CustomCache;
