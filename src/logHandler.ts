type Handler = (req: Request) => Response | Promise<Response>;

const logRequestResponse = function (req: Request, res: Response): void {
  const date = new Date().toISOString();
  const method = req.method;
  const url = new URL(req.url);
  const pathSearch = url.pathname + url.search;

  if (res.ok) {
    console.log(`[${date}] [${method}] ${pathSearch} ${res.status}`);
  } else {
    console.log(
      `[${date}] [${method}] ${pathSearch} ${res.status} ${res.statusText}`,
    );
  }
};

const logHandler = function (handler: Handler): Handler {
  return function (req: Request): Response | Promise<Response> {
    const res = handler(req);
    if (res instanceof Promise) {
      return res.then((res) => {
        logRequestResponse(req, res);
        return res;
      });
    } else {
      logRequestResponse(req, res);
      return res;
    }
  };
};

export default logHandler;
