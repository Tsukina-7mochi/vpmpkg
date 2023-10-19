const handler = (request: Request): Response => {
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

  return new Response(`${userName}, ${repoName}`);
}

export default handler;
