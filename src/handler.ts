import { getTags } from './ghApi.ts';
import wrapInTry from './wrapInTry.ts';

const handler_ = async (request: Request): Promise<Response> => {
  const pathname = new URL(request.url).pathname;

  if(!(/^\/\w+\/\w+\/$/.test(pathname))) {
    return new Response(JSON.stringify({
      message: 'Bad Request',
      usage: 'GET: /{OWNER}/{REPO}/'
    }), {
      status: 400,
      statusText: 'Bad Request'
    });
  }

  const [userName, repoName] = pathname.split('/').slice(1);

  try {
    const tags = await getTags(userName, repoName);

    return new Response(JSON.stringify(tags));
  } catch {
    return new Response(JSON.stringify({
      message: 'Not Found',
    }), {
      status: 404,
      statusText: 'Not Found',
    });
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
