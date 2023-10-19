import * as colors from 'fmt/colors.ts';
import * as dotenv from 'dotenv';

const dotenvContent = await dotenv.load({ envPath: './.env' });
for(const key in dotenvContent) {
  if(!Deno.env.has(key)) {
    Deno.env.set(key, dotenvContent[key]);
  }
}

const apiToken = Deno.env.get('VPMPKG_GH_API_TOKEN');
const cacheDir = Deno.env.get('VPMPKG_CACHE_DIR');

if (typeof cacheDir !== 'string') {
  throw Error('Cache directory is not specified.');
}

if (typeof apiToken !== 'string') {
  console.log(
    `${
      colors.yellow('Warning')
    }: GitHub API Token not found. Using public API.`,
  );
}

const env = { apiToken, cacheDir };

export default env;
