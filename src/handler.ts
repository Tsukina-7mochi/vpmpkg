import createRepoManifest from './createRepoManifest.ts';
import wrapInTry from './wrapInTry.ts';

const handler_ = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  const pathSegments = url.pathname.split('/');
  if(pathSegments.length < 4) {
    return new Response(JSON.stringify({
      message: 'Bad Request',
      usage: '/{OWNER}/{REPO}/{PATH}',
    }));
  }

  const owner = pathSegments[1];
  const repo = pathSegments[2];
  const pkgManifestPath = ((): string => {
    const path = `/${pathSegments.slice(3).join('/')}`;
    if(path.endsWith('/')) {
      return `${path}package.json`;
    }
    return path;
  })();

  try {
    const manifest = await createRepoManifest(owner, repo, pkgManifestPath, url.href);

    return new Response(JSON.stringify(manifest));
  } catch(err_) {
    const err = err_ instanceof Error
      ? ({ message: err_.message, cause: err_.cause })
      : err_;
    return new Response(JSON.stringify({
      message: 'Not Found',
      cause: err,
    }), { status: 404, statusText: 'Not Found' });
  }
}

const serverErrorResponsePromise = Promise.resolve(
  new Response(JSON.stringify({
    message: 'Something went wrong in the server.',
  }), {
    status: 500,
    statusText: 'Internal Server Error',
  })
);
const handler = wrapInTry(handler_, () => serverErrorResponsePromise)

export default handler;
