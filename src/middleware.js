/**
 * Runs a list of middleware functions sequentially, using the
 * Express-compatible (req, res, next) signature. This lets existing npm
 * packages such as helmet and cors run unmodified, since they don't
 * depend on Express internals — they only expect a generic (req, res, next).
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {Array<Function>} middlewares - The list of middleware functions.
 * @returns {Promise<void>} Resolves once the whole chain has completed
 *   (i.e. the final next() was called without error), or once a middleware
 *   halts the chain (e.g. a CORS preflight that ends the response directly).
 */
export function runMiddleware(req, res, middlewares) {
  return new Promise((resolve, reject) => {
    let index = 0;

    function next(err) {
      if (err) {
        return reject(err);
      }

      // all middleware has run, or the response has already been sent
      if (index >= middlewares.length || res.headersSent) {
        return resolve();
      }

      const middleware = middlewares[index++];

      try {
        middleware(req, res, next);
      } catch (err) {
        reject(err);
      }
    }

    next();
  });
}