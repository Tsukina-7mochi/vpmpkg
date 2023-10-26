import CustomCache from './cache.ts';
import createRepoManifest from './createRepoManifest.ts';
import wrapInTry from './wrapInTry.ts';
import { serveDir } from 'http/file_server.ts';
import { contentType } from 'media_types';
import { extname } from 'std/path/extname.ts';
import logHandler from './logHandler.ts';
import { Config } from './config.ts';
import { Handler } from './types.ts';

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
  const cache = new CustomCache(config.cachePath);

  const handler: Handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return Response.redirect(new URL('/web/index.html', request.url));
    }
    if (url.pathname.startsWith('/web')) {
      const res = await serveDir(request, {
        fsRoot: config.publicPath,
        urlRoot: 'web',
      });

      const type = contentType(extname(url.pathname));
      if (typeof type === 'string') {
        return new Response((await res).body, {
          headers: {
            ...res.headers,
            'Content-Type': type,
          },
        });
      } else {
        return res;
      }
    }

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
        cache,
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

  return logHandler(wrapInTry(handler, onServerError));
};

export default handler;
