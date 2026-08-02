/**
 * Naghahawak ng listahan ng routes bawat HTTP method, at nagma-match ng
 * incoming requests sa tamang handler. Pwedeng gumawa ng maraming instance
 * (hal. isa bawat "module" ng app) tapos i-mount sa Server gamit ang .use().
 */
export class Router {
  /**
   * @param {string} [prefix=""] - Path prefix na idadagdag sa lahat ng routes
   *   ng instance na ito (hal. "/users" para sa lahat ng user-related routes).
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
   * Nagrerehistro ng isang route sa ilalim ng partikular na HTTP method.
   * @param {"GET"|"POST"|"PUT"|"DELETE"|"PATCH"} method - Ang HTTP method.
   * @param {string} path - Ang route path (kasama na ang prefix sa huli).
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   *   Ang function na tatakbo kapag na-match ang route na ito.
   * @returns {void}
   */
  add(method, path, handler) {
    const fullPath = this._joinPath(this.prefix, path);
    this.routes[method].push({ path: fullPath, handler });
  }

  /**
   * Pinagsasama ang prefix at path nang walang duplicate na slashes.
   * @param {string} prefix - Ang path prefix ng router instance.
   * @param {string} path - Ang path na idadagdag sa prefix.
   * @returns {string} Ang buong pinagsamang path.
   */
  _joinPath(prefix, path) {
    const combined = `${prefix}${path}`;
    return combined.replace(/\/+/g, "/").replace(/(.+)\/$/, "$1") || "/";
  }

  /**
   * Kinokopya ang lahat ng routes ng ibang Router instance papunta dito.
   * Ginagamit ito ng Server.use() para i-mount ang mga sub-router.
   * @param {Router} otherRouter - Ang Router instance na i-mo-merge.
   * @returns {void}
   */
  merge(otherRouter) {
    for (const method of Object.keys(this.routes)) {
      this.routes[method].push(...otherRouter.routes[method]);
    }
  }

  /**
   * Nagrerehistro ng GET route.
   * @param {string} path - Ang route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  get(path, handler) {
    this.add("GET", path, handler);
  }

  /**
   * Nagrerehistro ng POST route.
   * @param {string} path - Ang route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  post(path, handler) {
    this.add("POST", path, handler);
  }

  /**
   * Nagrerehistro ng PUT route.
   * @param {string} path - Ang route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  put(path, handler) {
    this.add("PUT", path, handler);
  }

  /**
   * Nagrerehistro ng DELETE route.
   * @param {string} path - Ang route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  delete(path, handler) {
    this.add("DELETE", path, handler);
  }

  /**
   * Nagrerehistro ng PATCH route.
   * @param {string} path - Ang route path.
   * @param {(req: import("http").IncomingMessage, res: import("http").ServerResponse) => any} handler
   * @returns {void}
   */
  patch(path, handler) {
    this.add("PATCH", path, handler);
  }

  /**
   * Hinahanap ang route na tumutugma sa method at pathname.
   * Simple exact match muna; balang araw pwede pang idagdag ang :params support.
   * @param {string} method - Ang HTTP method ng incoming request.
   * @param {string} pathname - Ang pathname ng incoming request.
   * @returns {{ path: string, handler: Function } | null} Ang natagpuang route, o null kung wala.
   */
  match(method, pathname) {
    const routeList = this.routes[method] || [];
    return routeList.find((route) => route.path === pathname) || null;
  }
}