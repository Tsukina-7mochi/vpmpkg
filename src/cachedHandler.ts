import { AsyncCustomCache, CustomCache } from './cache.ts';
import { Handler } from './types.ts';

const createCachedHandler = function (
  handler: Handler,
  cache: CustomCache<Response> | AsyncCustomCache<Response>,
  cachedCallback?: (req: Request, res: Response) => void | Promise<void>,
): Handler {
  return async function (req: Request): Promise<Response> {
    const cachedRes = await cache.get(req.url);
    if (cachedRes !== null) {
      if (cachedCallback) {
        await cachedCallback(req, cachedRes);
      }

      return cachedRes.clone();
    }

    const res = await handler(req);
    cache.set(req.url, res.clone());

    return res;
  };
};

export { createCachedHandler };
