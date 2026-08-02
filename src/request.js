/**
 * Enhances the raw Node.js request object with additional properties
 * (pathname, query params, and a slot for future route params).
 * @param {import("http").IncomingMessage} req - The raw request object from http.createServer.
 * @returns {import("http").IncomingMessage} The same req object, now with the new properties.
 */
export function enhanceRequest(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  req.pathname = url.pathname;
  req.query = Object.fromEntries(url.searchParams);
  req.params = {}; // reserved for future :id route param support

  return req;
}

/**
 * Reads and resolves the full body of a request (POST/PUT/PATCH payloads).
 * Automatically parses as JSON when the Content-Type is "application/json",
 * otherwise resolves the raw string.
 * @param {import("http").IncomingMessage} req - The raw request object with an incoming data stream.
 * @returns {Promise<Object|string>} The parsed JSON object, or the raw string if not JSON.
 * @throws {Error & { statusCode: number, clientError: boolean }} When the JSON is invalid, the
 *   error carries `statusCode: 400` and `clientError: true` so the server knows this is a
 *   client error, not a server error.
 */
export function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      if (!data) return resolve({});

      const contentType = req.headers["content-type"] || "";

      try {
        if (contentType.includes("application/json")) {
          resolve(JSON.parse(data));
        } else {
          resolve(data); // raw string if not JSON
        }
      } catch (err) {
        // mark as a client error (400), not a server error (500)
        err.statusCode = 400;
        err.clientError = true;
        reject(err);
      }
    });

    req.on("error", reject);
  });
}