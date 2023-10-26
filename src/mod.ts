import { Server } from 'http/mod.ts';
import handler from './handler.ts';
import * as cfg from './config.ts';
import * as color from 'https://deno.land/std@0.204.0/fmt/colors.ts';

const config = await cfg.fromEnv();
const { hostname, port } = config;

const server = new Server({ hostname, port, handler: handler(config) });

if (config.ghApiToken === null) {
  console.warn(
    color.yellow('Warning'),
    'GitHub API Token not found. Using public API.',
  );
}

if (config.tlsCertFilePath !== null && config.tlsKeyFilePath !== null) {
  console.log(`Server started over TLS.
    hostname: ${hostname}
    port    : ${port}
  `);

  await server.listenAndServeTls(config.tlsCertFilePath, config.tlsKeyFilePath);
} else {
  console.log(`Server started.
    hostname: ${hostname}
    port    : ${port}
  `);

  await server.listenAndServe();
}
