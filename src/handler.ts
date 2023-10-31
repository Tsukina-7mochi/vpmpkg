import { Hono } from 'hono';
import { cache, serveStatic } from 'hono/middleware.ts';
import * as color from 'color';
import { DiskCache } from './cache.ts';
import createRepoManifest from './createRepoManifest.ts';
import { Config } from './config.ts';
import * as posix from 'path/posix/mod.ts';
import { FetchError } from './ghApi.ts';

const toIdCompatibleString = (str: string) =>
  str.toLowerCase().replace(/[^\w._\-]/g, '');

const getStatusColor = function (status: number): (text: string) => string {
  if (status < 200) {
    return (text: string) => `${color.bold(String(status))} ${text}`;
  } else if (status < 300) {
    return (text: string) =>
      color.brightGreen(`${color.bold(String(status))} ${text}`);
  } else if (status < 400) {
    return (text: string) =>
      color.brightBlue(`${color.bold(String(status))} ${text}`);
  } else if (status < 500) {
    return (text: string) =>
      color.brightYellow(`${color.bold(String(status))} ${text}`);
  } else {
    return (text: string) =>
      color.brightRed(`${color.bold(String(status))} ${text}`);
  }
};

const handler = (config: Config): Hono => {
  const releaseAPICache = new DiskCache(
    posix.join(config.cachePath, 'api', 'release'),
    config.apiCacheTTL,
  );
  const contentAPICache = new DiskCache(
    posix.join(config.cachePath, 'api', 'release'),
  ); // permanent cache

  setInterval(() => releaseAPICache.clean(), config.apiCacheTTL);

  const app = new Hono();

  app.use('*', async (c, next) => {
    const startTime = Date.now();

    await next();

    const endTime = Date.now();

    const message = `
    |${color.bold(c.req.method)}
    | ${c.req.path}
    | ${getStatusColor(c.res.status)(c.res.statusText)}
    | (${color.gray(`${endTime - startTime}`)}ms)
    | `.replace(/(\r|\n|\r\n)\s*\|/g, '');
    console.log(message);
  });

  app.onError((err, c) => {
    console.error(err);
    return c.text('Something went wrong', 500);
  });

  app.get('/', (c) => c.redirect('/static/index.html'));

  const staticPath = '/static/*';
  app.get(
    staticPath,
    cache({
      cacheName: 'vpmpkg.ts7m.net.static',
      cacheControl: 'max-age=3600',
      wait: true,
    }),
  );
  app.get(
    staticPath,
    serveStatic({
      root: config.publicPath,
      rewriteRequestPath: (path) => path.replace(/^\/static/, ''),
    }),
  );

  const apiPath = '/:owner/:repo/:path{.+$}';
  app.get(
    apiPath,
    cache({
      cacheName: 'vpmpkg.ts7m.net.api',
      cacheControl: 'max-age=60',
      wait: true,
    }),
  );
  app.get(apiPath, (c) => {
    const owner = c.req.param('owner');
    const repo = c.req.param('repo');
    const manifestPath = (() => {
      const path = '/' + c.req.param('path');
      return path.endsWith('/') ? `${path}package.json` : path;
    })();
    const pkgId = c.req.query('pkgId') ??
      toIdCompatibleString(`net.ts7m.vpmpkg.${owner}.${repo}`);

    const manifestPromise = createRepoManifest(
      owner,
      repo,
      manifestPath,
      pkgId,
      c.req.url,
      config,
      releaseAPICache,
      contentAPICache,
    );
    return manifestPromise
      .then((manifest) => c.json(manifest))
      .catch((err) => {
        if (err instanceof FetchError) {
          return c.notFound();
        } else {
          throw err;
        }
      });
  });

  return app;
};

export default handler;
