import { Server } from 'http/mod.ts';
import handler from './handler.ts';
import * as cfg from './config.ts';
import * as color from 'color';

const config = await cfg.fromEnv();
const { hostname, port } = config;

if (config.ghApiToken === null) {
  console.warn(
    color.bold(color.brightYellow('Warning')),
    'GitHub API Token not found. Using public API.',
  );
}

const server = new Server({ hostname, port, handler: handler(config).fetch });

if (config.tlsCertFilePath !== null && config.tlsKeyFilePath !== null) {
  console.log(`${color.bold('Server started over TLS.')}
    | hostname: ${hostname}
    | port    : ${port}
  `.replace(/(\r|\n|\r\n)\s*\| /g, '$1    '));

  await server.listenAndServeTls(config.tlsCertFilePath, config.tlsKeyFilePath);
} else {
  console.log(`${color.bold('Server started.')}
    | hostname: ${hostname}
    | port    : ${port}
  `.replace(/(\r|\n|\r\n)\s*\| /g, '$1    '));

  await server.listenAndServe();
}
