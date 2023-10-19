import { Server } from 'http/mod.ts';
import handler from './handler.ts';
import env from './env.ts';

const { hostname, port } = env;

const server = new Server({ hostname, port, handler });

console.log(`Server started.
  hostname: ${hostname}
  port    : ${port}
`);

await server.listenAndServe();
