import { Server } from 'http/mod.ts';
import * as colors from 'fmt/colors.ts';
import handler from './handler.ts';
import apiToken from './apiToken.ts';

const hostname = '0.0.0.0';
const port = 8080;

const server = new Server({ hostname, port, handler });

if (typeof apiToken !== 'string') {
  console.log(
    `${
      colors.yellow('Warning')
    }: GitHub API Token not found. Using public API.`,
  );
}
console.log(`Server started.
  hostname: ${hostname}
  port    : ${port}
`);

await server.listenAndServe();
