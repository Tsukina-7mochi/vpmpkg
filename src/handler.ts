import CustomCache from './cache.ts';
import createRepoManifest from './createRepoManifest.ts';
import wrapInTry from './wrapInTry.ts';
import env from './env.ts';
import { serveDir } from 'http/file_server.ts';
import { contentType } from 'media_types';
import { extname } from 'std/path/extname.ts';

const cache = new CustomCache(env.cacheDir);

const handler_ = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  if(url.pathname === '/') {
    return Response.redirect(new URL('/web/index.html', request.url));
  }
  if(url.pathname.startsWith('/web')) {
    const res = await serveDir(request, {
      fsRoot: env.pubDir,
      urlRoot: 'web'
    });

    const type = contentType(extname(url.pathname));
    console.log(extname(url.pathname), type);

    if(typeof type === 'string') {
      return new Response((await res).body, {
        headers: {
          ...res.headers,
          "Content-Type": type,
        }
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
  for(const [key, value] of url.searchParams) {
    if(key === 'pkgId') {
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

const serverErrorResponsePromise = Promise.resolve(
  new Response(
    JSON.stringify({
      message: 'Something went wrong in the server.',
    }),
    {
      status: 500,
      statusText: 'Internal Server Error',
    },
  ),
);
const handler = wrapInTry(handler_, () => serverErrorResponsePromise);

export default handler;
