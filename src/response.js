/**
 * Nagpapalawak sa raw Node.js response object gamit ang dagdag na helper methods.
 * @param {import("http").ServerResponse} res - Ang raw response object mula sa http.createServer.
 * @returns {import("http").ServerResponse} Yung parehong res object, may bagong methods na.
 */
export function enhanceResponse(res) {
  /**
   * Nagse-set ng HTTP status code, chainable.
   * @param {number} code - HTTP status code (hal. 200, 404, 500).
   * @returns {import("http").ServerResponse} Yung res mismo, para pwedeng i-chain (res.status(404).send(...)).
   */
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  /**
   * Nagpapadala ng response. Auto-detect kung JSON o plain text ang ipapadala
   * batay sa type ng data.
   * @param {any} data - Ang ipapadalang laman ng response.
   * @returns {void}
   */
  res.send = (data) => {
    if (res.headersSent) return;

    if (data !== null && typeof data === "object") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    } else {
      res.setHeader("Content-Type", "text/plain");
      res.end(String(data));
    }
  };

  /**
   * Nagpapadala ng response bilang JSON, hindi na kailangan i-check ang type.
   * @param {Object} data - Ang object na i-se-serialize papuntang JSON.
   * @returns {void}
   */
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };

  return res;
}