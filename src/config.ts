import Env from './env.ts';
import * as posix from 'path/posix/mod.ts';

type Config = {
  ghApiToken: string | null;
  cachePath: string;
  publicPath: string;
  hostname: string;
  port: number;
  tlsCertFilePath: string | null;
  tlsKeyFilePath: string | null;
};

const fromEnv = async function (): Promise<Config> {
  const env = new Env();

  await env.loadEnvFile(posix.resolve('./.env'));

  return {
    ghApiToken: env.getOrNull('GH_API_TOKEN'),
    cachePath: env.get('CACHE_DIR'),
    publicPath: env.get('PUB_DIR'),
    hostname: env.get('HOSTNAME'),
    port: Number(env.get('PORT')),
    tlsCertFilePath: env.getOrNull('TLS_CERT_FILE_PATH'),
    tlsKeyFilePath: env.getOrNull('TLS_KEY_FILE_PATH'),
  };
};

export type { Config };
export { fromEnv };
