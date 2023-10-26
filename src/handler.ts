import { DiskCache, InMemoryCache } from './cache.ts';
import { createCachedHandler } from './cachedHandler.ts';
import createRepoManifest from './createRepoManifest.ts';
import { serveDir } from 'http/file_server.ts';
import { contentType } from 'media_types';
import { extname } from 'std/path/extname.ts';
import { Config } from './config.ts';
import { Handler } from './types.ts';
import logRequestResponse from './logRequestResponse.ts';
import * as posix from 'path/posix/mod.ts';

const serverErrorResponse = new Response(
  JSON.stringify({
    message: 'Something went wrong in the server.',
  }),
  {
    status: 500,
    statusText: 'Internal Server Error',
  },
);
// deno-lint-ignore no-explicit-any
const onServerError = function (err: any): Response {
  console.error(err);

  return serverErrorResponse;
};

const handler = (config: Config): Handler => {
  const resultCache = new InMemoryCache<Response>(config.requestCacheTTL);
  const releaseAPICache = new DiskCache(
    posix.join(config.cachePath, 'api', 'release'),
    config.apiCacheTTL,
  );
  const contentAPICache = new DiskCache(
    posix.join(config.cachePath, 'api', 'release'),
  ); // permanent cache
  const publicCache = new InMemoryCache<Response>(); // permanent cache

  setInterval(() => resultCache.clean(), config.requestCacheTTL);
  setInterval(() => releaseAPICache.clean(), config.apiCacheTTL);

  const publicHandler = async (
    request: Request,
    url: URL,
  ): Promise<Response> => {
    if (!url.pathname.startsWith('/web')) {
      throw Error('Cannot handle path not starts with /web');
    }

    const res = await serveDir(request, {
      fsRoot: config.publicPath,
      urlRoot: 'web',
    });

    const type = contentType(extname(url.pathname));
    if (res.ok && typeof type === 'string') {
      return new Response((await res).body, {
        headers: {
          ...res.headers,
          'Content-Type': type,
        },
      });
    } else {
      return res;
    }
  };

  const apiHandler = async (url: URL): Promise<Response> => {
    const pathSegments = url.pathname.split('/');
    if (pathSegments.length < 4) {
      return new Response(JSON.stringify({
        message: 'Bad Request',
        usage: '/{OWNER}/{REPO}/{PATH}',
      }));
    }

    const owner = pathSegments[1];
    const repo = pathSegments[2];
    const pkgManifestPath = ((): string => {
      const path = `/${pathSegments.slice(3).join('/')}`;
      if (path.endsWith('/')) {
        return `${path}package.json`;
      }
      return path;
    })();
    const idOwner = owner.toLowerCase().replace(/\W/, '');
    const idRepo = repo.toLowerCase().replace(/\W/, '');
    let pkgId = `net.ts7m.vpmpkg.${idOwner}.${idRepo}`;
    for (const [key, value] of url.searchParams) {
      if (key === 'pkgId') {
        pkgId = value;
      }
    }

    try {
      const manifest = await createRepoManifest(
        owner,
        repo,
        pkgManifestPath,
        pkgId,
        url.href,
        config,
        releaseAPICache,
        contentAPICache,
      );

      return new Response(JSON.stringify(manifest));
    } catch (err_) {
      const err = err_ instanceof Error
        ? ({ message: err_.message, cause: err_.cause })
        : err_;
      return new Response(
        JSON.stringify({
          message: 'Not Found',
          cause: err,
        }),
        { status: 404, statusText: 'Not Found' },
      );
    }
  };

  const handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return Response.redirect(new URL('/web/index.html', request.url));
    }
    if (url.pathname.startsWith('/web')) {
      const cached = publicCache.get(url.href);
      if (cached !== null) {
        return Promise.resolve(cached);
      }

      const response = await publicHandler(request, url);
      if (response.ok) {
        publicCache.set(url.href, response);
      }
      return response;
    }

    return apiHandler(url);
  };

  const caughtHandler = (req: Request) => handler(req).catch(onServerError);
  const cachedHandler = createCachedHandler(
    caughtHandler,
    resultCache,
    (req) => {
      console.log('Cached', req.url);
    },
  );
  return (req) =>
    Promise.resolve(cachedHandler(req)).then((res) => {
      logRequestResponse(req, res);
      return res;
    });
};

export default handler;
