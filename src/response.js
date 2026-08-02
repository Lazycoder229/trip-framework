/**
 * Enhances the raw Node.js response object with additional helper methods.
 * @param {import("http").ServerResponse} res - The raw response object from http.createServer.
 * @param {import("http").IncomingMessage} req - The raw request object, used to detect HEAD requests.
 * @returns {import("http").ServerResponse} The same res object, now with the new methods.
 */
export function enhanceResponse(res, req) {
  /**
   * Sets the HTTP status code, chainable.
   * @param {number} code - HTTP status code (e.g. 200, 404, 500).
   * @returns {import("http").ServerResponse} res itself, so it can be chained (res.status(404).send(...)).
   */
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  /**
   * Ends the response following the HTTP spec for HEAD requests: sets
   * Content-Length as if the body were sent, but omits the actual body.
   * @param {string} body - The fully-serialized response body.
   * @returns {void}
   */
  function sendBody(body) {
    res.setHeader("Content-Length", Buffer.byteLength(body));

    if (req && req.method === "HEAD") {
      // HEAD must report the same headers a GET would, but without a body
      res.end();
    } else {
      res.end(body);
    }
  }

  /**
   * Sends a response. Auto-detects whether to send JSON or plain text
   * based on the type of the data.
   * @param {any} data - The content to send in the response.
   * @returns {void}
   */
  res.send = (data) => {
    if (res.headersSent) return;

    if (data !== null && typeof data === "object") {
      res.setHeader("Content-Type", "application/json");
      sendBody(JSON.stringify(data));
    } else {
      res.setHeader("Content-Type", "text/plain");
      sendBody(String(data));
    }
  };

  /**
   * Sends a response as JSON, without needing to check the data type.
   * @param {Object} data - The object to serialize to JSON.
   * @returns {void}
   */
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json");
    sendBody(JSON.stringify(data));
  };

  return res;
}