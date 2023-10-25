import * as colors from 'fmt/colors.ts';
import * as dotenv from 'dotenv';

const dotenvContent = await dotenv.load({ envPath: './.env' });
for(const key in dotenvContent) {
  if(!Deno.env.has(key)) {
    Deno.env.set(key, dotenvContent[key]);
  }
}

const apiToken = Deno.env.get('GH_API_TOKEN');
const cacheDir = Deno.env.get('CACHE_DIR');
const pubDir = Deno.env.get('PUB_DIR');
const hostname = Deno.env.get('HOSTNAME');
const port = Deno.env.get('PORT');
const tlsCertFilePath = Deno.env.get('TLS_CERT_FILE_PATH');
const tlsKeyFilePath = Deno.env.get('TLS_KEY_FILE_PATH');

if (typeof cacheDir !== 'string') {
  throw Error('Cache directory not specified.');
}
if (typeof pubDir !== 'string') {
  throw Error('Public directory not specified.');
}
if (typeof hostname !== 'string') {
  throw Error('Hostname not specified.');
}
if (typeof port !== 'string') {
  throw Error('Port not specified.');
}

if (typeof apiToken !== 'string') {
  console.log(
    `${
      colors.yellow('Warning')
    }: GitHub API Token not found. Using public API.`,
  );
}

const env = {
  apiToken,
  cacheDir,
  pubDir,
  hostname,
  port: parseInt(port),
  tlsCertFilePath,
  tlsKeyFilePath,
};

export default env;
