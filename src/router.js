// router.js
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
   * Registers a route under a specific HTTP method. Compiles the path into
   * a regex once at registration time (not per-request) for performance,
   * and extracts any `:param` names along the way.
   * @param {"GET"|"POST"|"PUT"|"DELETE"|"PATCH"} method - The HTTP method.
   * @param {string} path - The route path (prefix will be prepended). May
   *   contain `:name` segments, e.g. "/users/:id/posts/:postId".
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   *   The function to run when this route matches.
   * @returns {void}
   */
  add(method, path, handler) {
    const fullPath = this._joinPath(this.prefix, path);
    const { regex, paramNames } = this._compilePath(fullPath);
    this.routes[method].push({ path: fullPath, handler, regex, paramNames });
  }

  /**
   * Compiles a path pattern (e.g. "/users/:id") into a matching regex plus
   * the ordered list of param names found, so match() can zip captured
   * groups back into named params later without re-parsing the string.
   * @param {string} path - The full path pattern, dashes/prefix already applied.
   * @returns {{ regex: RegExp, paramNames: string[] }}
   */
 // router.js
_compilePath(path) {
  const paramNames = [];

  const pattern = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1)); // alisin yung ":" prefix, kunin lang pangalan
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape literal segments lang
    })
    .join("/");

  return { regex: new RegExp(`^${pattern}$`), paramNames };
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

  get(path, handler) {
    this.add("GET", path, handler);
  }
  post(path, handler) {
    this.add("POST", path, handler);
  }
  put(path, handler) {
    this.add("PUT", path, handler);
  }
  delete(path, handler) {
    this.add("DELETE", path, handler);
  }
  patch(path, handler) {
    this.add("PATCH", path, handler);
  }

  /**
   * Finds the route that matches the given method and pathname, extracting
   * any `:param` values along the way. HEAD requests automatically fall
   * back to matching GET routes, since HEAD is expected to behave like GET
   * but without a response body.
   * @param {string} method - The HTTP method of the incoming request.
   * @param {string} pathname - The pathname of the incoming request.
   * @returns {{ path: string, handler: Function, params: Object<string, string> } | null}
   *   The matched route (with extracted params), or null if none found.
   */
  match(method, pathname) {
    const lookupMethod = method === "HEAD" ? "GET" : method;
    const routeList = this.routes[lookupMethod] || [];

    for (const route of routeList) {
      const result = route.regex.exec(pathname);
      if (!result) continue;

      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(result[i + 1]);
      });

      return { path: route.path, handler: route.handler, params };
    }

    return null;
  }
}