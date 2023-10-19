import { Server } from 'http/mod.ts';
import handler from './handler.ts';

const hostname = '0.0.0.0';
const port = 8080;

const server = new Server({ hostname, port, handler });

console.log(`Server started.
  hostname: ${hostname}
  port    : ${port}
`);

await server.listenAndServe();
