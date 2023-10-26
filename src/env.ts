import * as dotenv from 'dotenv';

const dotenvContent = await dotenv.load({ envPath: './.env' });
for (const key in dotenvContent) {
  if (!Deno.env.has(key)) {
    Deno.env.set(key, dotenvContent[key]);
  }
}

class Env {
  values: Record<string, string>;

  constructor() {
    this.values = Deno.env.toObject();
  }

  async loadEnvFile(path: string, overwrite = true): Promise<void> {
    const content = await dotenv.load({ envPath: path });

    for (const key in content) {
      if (!(key in this.values) || overwrite) {
        this.values[key] = content[key];
      }
    }
  }

  get(key: string): string {
    if (!(key in this.values)) {
      throw Error(`environment variable ${key} is not found.`);
    }
    return this.values[key];
  }

  getOrElse<T>(key: string, defaultValue: T): string | T {
    return this.values[key] ?? defaultValue;
  }

  getOrNull(key: string): string | null {
    return this.getOrElse(key, null);
  }
}

export default Env;
