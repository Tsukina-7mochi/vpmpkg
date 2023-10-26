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

export default logRequestResponse;
