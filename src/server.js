import http from "node:http";
import { Router } from "./router.js";
import { enhanceRequest, parseBody } from "./request.js";
import { enhanceResponse } from "./response.js";
import { runMiddleware } from "./middleware.js";

/**
 * The core class of the Trip framework. It ties together the HTTP server,
 * the router, request/response enhancement, and middleware into a single instance.
 */
export class Trip {
  /**
   * @param {number} [port=3000] - The port the server will listen on.
   * @param {string} [hostname="localhost"] - The hostname to bind to. Use
   *   "0.0.0.0" when deploying to cloud platforms (Render, Railway, etc.).
   */
  constructor(port = 3000, hostname = "localhost") {
    this.port = port;
    this.hostname = hostname;
    this.router = new Router();
    this.middlewares = [];
    this.server = http.createServer(this.handleRequest);
  }

  /**
   * Registers a GET route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {Trip} The Trip instance itself, so it can be chained.
   */
  get(path, handler) {
    this.router.get(path, handler);
    return this;
  }

  /**
   * Registers a POST route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {Trip} The Trip instance itself, so it can be chained.
   */
  post(path, handler) {
    this.router.post(path, handler);
    return this;
  }

  /**
   * Registers a PUT route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {Trip} The Trip instance itself, so it can be chained.
   */
  put(path, handler) {
    this.router.put(path, handler);
    return this;
  }

  /**
   * Registers a DELETE route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {Trip} The Trip instance itself, so it can be chained.
   */
  delete(path, handler) {
    this.router.delete(path, handler);
    return this;
  }

  /**
   * Registers a PATCH route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {Trip} The Trip instance itself, so it can be chained.
   */
  patch(path, handler) {
    this.router.patch(path, handler);
    return this;
  }

  /**
   * Mounts a Router instance (a group of routes), OR adds a global
   * middleware function that will run before all routes. Middleware is
   * compatible with Express-style packages (helmet, cors, etc.) since it
   * follows the generic (req, res, next) signature.
   * @param {Router | ((req: import("http").IncomingMessage, res: import("http").ServerResponse, next: Function) => void)} fnOrRouter
   *   A Router instance to mount, or a middleware function to add to the chain.
   * @returns {Trip} The Trip instance itself, so it can be chained.
   */
  use(fnOrRouter) {
    if (fnOrRouter instanceof Router) {
      this.router.merge(fnOrRouter);
    } else if (typeof fnOrRouter === "function") {
      this.middlewares.push(fnOrRouter);
    } else {
      throw new TypeError("app.use() expects a Router instance or a middleware function");
    }
    return this;
  }

  /**
   * The core request handler passed to http.createServer.
   * Enhances req/res, runs the global middleware chain (helmet, cors, etc.),
   * then finds the matching route and runs its handler. Also parses the body
   * for POST/PUT/PATCH, and handles errors (400 for invalid JSON, 500 for
   * anything else).
   * @param {import("http").IncomingMessage} req
   * @param {import("http").ServerResponse} res
   * @returns {Promise<void>}
   */
  handleRequest = async (req, res) => {
    enhanceRequest(req);
    enhanceResponse(res);

    try {
      await runMiddleware(req, res, this.middlewares);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).send({ error: "Internal server error" });
      }
      return;
    }

    // if the response was already ended during the middleware chain
    // (e.g. CORS preflight, or a middleware that blocked the request), stop here
    if (res.headersSent) return;

    const method = req.method.toUpperCase();
    const route = this.router.match(method, req.pathname);

    if (!route) {
      res.status(404).send({ error: "Not found", path: req.pathname });
      return;
    }

    req.params = route.params;
    try {
      // read the body for POST/PUT/PATCH before running the handler
      if (["POST", "PUT", "PATCH"].includes(method)) {
        req.body = await parseBody(req);
      }

      const result = route.handler(req, res);

      // if a value was returned and the response hasn't been sent yet, auto-send it
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

  /**
   * Starts the server on the configured port and hostname.
   * @param {(message: string) => void} [cb] - Optional callback invoked once
   *   listening starts. If omitted, logs the message to the console instead.
   * @returns {import("http").Server} The http.Server instance itself.
   */
  listen(cb) {
    this.server.listen(this.port, this.hostname, () => {
      const message = `Server running at http://${this.hostname}:${this.port}/`;
      cb ? cb(message) : console.log(message);
    });
    return this.server;
  }
}