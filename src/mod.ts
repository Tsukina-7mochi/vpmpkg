import { Server } from 'http/mod.ts';
import handler from './handler.ts';
import env from './env.ts';

const { hostname, port, tlsCertFilePath, tlsKeyFilePath } = env;

const server = new Server({ hostname, port, handler });

if (typeof tlsCertFilePath === 'string' && typeof tlsKeyFilePath === 'string') {
  console.log(`Server started over TLS.
    hostname: ${hostname}
    port    : ${port}
  `);

  await server.listenAndServeTls(tlsCertFilePath, tlsKeyFilePath);
} else {
  console.log(`Server started.
    hostname: ${hostname}
    port    : ${port}
  `);

  await server.listenAndServe();
}
