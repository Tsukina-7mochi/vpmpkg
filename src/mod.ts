import { Server } from 'http/mod.ts';
import handler from './handler.ts';

const server = new Server({
  hostname: '0.0.0.0',
  port: 8080,
  handler
});
await server.listenAndServe();
