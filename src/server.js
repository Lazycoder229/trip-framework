import http from "node:http";
import { Router } from "./router.js";
import { enhanceRequest, parseBody } from "./request.js";
import { enhanceResponse } from "./response.js";

export class Trip {
  constructor(port = 3000, hostname = "localhost") {
    this.port = port;
    this.hostname = hostname;
    this.router = new Router();
    this.server = http.createServer(this.handleRequest);
  }

  // proxy methods papunta sa router, para diretso na app.get(...) ang tawag
  get(path, handler) {
    this.router.get(path, handler);
    return this;
  }

  post(path, handler) {
    this.router.post(path, handler);
    return this;
  }

  put(path, handler) {
    this.router.put(path, handler);
    return this;
  }

  delete(path, handler) {
    this.router.delete(path, handler);
    return this;
  }

  patch(path, handler) {
    this.router.patch(path, handler);
    return this;
  }

  // i-mount ang isang hiwalay na Router instance papunta sa main router
  use(subRouter) {
    this.router.merge(subRouter);
    return this;
  }

  handleRequest = async (req, res) => {
    enhanceRequest(req);
    enhanceResponse(res);

    const method = req.method.toUpperCase();
    const route = this.router.match(method, req.pathname);

    if (!route) {
      res.status(404).send({ error: "Not found", path: req.pathname });
      return;
    }

    try {
      // basahin body kapag POST/PUT/PATCH bago tumakbo yung handler
      if (["POST", "PUT", "PATCH"].includes(method)) {
        req.body = await parseBody(req);
      }

      const result = route.handler(req, res);

      // pag may return value tapos hindi pa naipadala yung response, auto-send
      if (result !== undefined && !res.headersSent) {
        res.send(result);
      }
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        if (err.clientError) {
          res.status(err.statusCode).send({ error: "Bad request", message: "Invalid JSON body" });
        } else {
          res.status(500).send({ error: "Internal server error" });
        }
      }
    }
  };

  /* 
   * Start the server
   * @param {Function} cb - Callback function to be called when the server starts
   */
  listen(cb) {
    this.server.listen(this.port, this.hostname, () => {
      const message = `Server running at http://${this.hostname}:${this.port}/`;
      cb ? cb(message) : console.log(message);
    });
    return this.server;
  }
}