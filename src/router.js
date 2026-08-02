/**
 * Holds a list of routes per HTTP method, and matches incoming requests
 * to the correct handler. Multiple instances can be created (e.g. one per
 * "module" of the app) and then mounted onto a Trip instance via .use().
 */
export class Router {
  /**
   * @param {string} [prefix=""] - Path prefix added to all routes registered
   *   on this instance (e.g. "/users" for all user-related routes).
   */
  constructor(prefix = "") {
    this.prefix = prefix;
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: [],
      PATCH: [],
    };
  }

  /**
   * Registers a route under a specific HTTP method.
   * @param {"GET"|"POST"|"PUT"|"DELETE"|"PATCH"} method - The HTTP method.
   * @param {string} path - The route path (prefix will be prepended).
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   *   The function to run when this route matches.
   * @returns {void}
   */
  add(method, path, handler) {
    const fullPath = this._joinPath(this.prefix, path);
    this.routes[method].push({ path: fullPath, handler });
  }

  /**
   * Joins a prefix and a path together without producing duplicate slashes.
   * @param {string} prefix - The router instance's path prefix.
   * @param {string} path - The path to append to the prefix.
   * @returns {string} The combined full path.
   */
  _joinPath(prefix, path) {
    const combined = `${prefix}${path}`;
    return combined.replace(/\/+/g, "/").replace(/(.+)\/$/, "$1") || "/";
  }

  /**
   * Copies all routes from another Router instance into this one.
   * Used by Trip.use() to mount sub-routers.
   * @param {Router} otherRouter - The Router instance to merge in.
   * @returns {void}
   */
  merge(otherRouter) {
    for (const method of Object.keys(this.routes)) {
      this.routes[method].push(...otherRouter.routes[method]);
    }
  }

  /**
   * Registers a GET route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  get(path, handler) {
    this.add("GET", path, handler);
  }

  /**
   * Registers a POST route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  post(path, handler) {
    this.add("POST", path, handler);
  }

  /**
   * Registers a PUT route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  put(path, handler) {
    this.add("PUT", path, handler);
  }

  /**
   * Registers a DELETE route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  delete(path, handler) {
    this.add("DELETE", path, handler);
  }

  /**
   * Registers a PATCH route.
   * @param {string} path - The route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  patch(path, handler) {
    this.add("PATCH", path, handler);
  }

  /**
   * Finds the route that matches the given method and pathname.
   * HEAD requests automatically fall back to matching GET routes, since
   * HEAD is expected to behave like GET but without a response body.
   * Simple exact match for now; :param support may be added later.
   * @param {string} method - The HTTP method of the incoming request.
   * @param {string} pathname - The pathname of the incoming request.
   * @returns {{ path: string, handler: Function } | null} The matched route, or null if none found.
   */
  match(method, pathname) {
    const lookupMethod = method === "HEAD" ? "GET" : method;
    const routeList = this.routes[lookupMethod] || [];
    return routeList.find((route) => route.path === pathname) || null;
  }
}