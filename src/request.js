/**
 * Nagpapalawak sa raw Node.js request object gamit ang dagdag na properties
 * (pathname, query params, at lugar para sa route params).
 * @param {import("http").IncomingMessage} req - Ang raw request object mula sa http.createServer.
 * @returns {import("http").IncomingMessage} Yung parehong req object, may bagong properties na.
 */
export function enhanceRequest(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  req.pathname = url.pathname;
  req.query = Object.fromEntries(url.searchParams);
  req.params = {}; // gagamitin natin to pag nagdagdag na tayo ng :id support

  return req;
}

/**
 * Binabasa at nire-resolve ang buong body ng request (POST/PUT/PATCH payloads).
 * Awtomatikong nagpa-parse bilang JSON kung "application/json" ang Content-Type,
 * kung hindi, ibabalik na lang bilang raw string.
 * @param {import("http").IncomingMessage} req - Ang raw request object na may incoming data stream.
 * @returns {Promise<Object|string>} Ang na-parse na JSON object, o raw string kung hindi JSON.
 * @throws {Error & { statusCode: number, clientError: boolean }} Kapag invalid ang JSON, may
 *   `statusCode: 400` at `clientError: true` na nakalagay sa error para malaman ng server
 *   na kasalanan ito ng client, hindi server error.
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
          resolve(data); // raw string kung hindi JSON
        }
      } catch (err) {
        // markahan bilang client error (400), hindi server error (500)
        err.statusCode = 400;
        err.clientError = true;
        reject(err);
      }
    });

    req.on("error", reject);
  });
}