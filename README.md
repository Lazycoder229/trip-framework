# Trip

A minimal, dependency-free HTTP framework for Node.js — built from scratch on top of the native `http` module. Trip gives you Express-style routing, middleware, and request/response helpers without pulling in Express itself, while staying compatible with the Express middleware ecosystem (helmet, cors, and similar packages work out of the box).

## Why Trip

Trip exists to be small, readable, and easy to extend. There's no hidden magic — the entire routing/middleware pipeline is a few hundred lines of plain JavaScript you can read in one sitting. It's a good fit if you want:

- A lightweight core for a small API or microservice
- A learning reference for how HTTP frameworks work under the hood
- A base to build your own opinionated framework on top of

## Features

- **Familiar routing API** — `app.get()`, `app.post()`, `app.put()`, `app.delete()`, `app.patch()`
- **Mountable Router instances** — split routes across files/modules and mount them with a path prefix
- **Express-compatible middleware** — `app.use(fn)` runs middleware with the standard `(req, res, next)` signature, so packages like `helmet` and `cors` work without modification
- **Automatic body parsing** — JSON request bodies are parsed automatically for POST/PUT/PATCH; malformed JSON returns `400 Bad Request` instead of crashing
- **Enhanced request object** — `req.query`, `req.pathname`, `req.body` ready to use
- **Enhanced response object** — `res.send()`, `res.json()`, `res.status()` (chainable)
- **Auto-send on return** — return a value from a handler instead of calling `res.send()` manually
- **Spec-compliant HEAD requests** — `HEAD` automatically matches `GET` routes and reports the correct `Content-Length` without sending a body
- **Centralized error handling** — thrown errors in a handler become a `500` response instead of crashing the server
- **Cloud-deploy ready** — bind to `0.0.0.0` and read the port from `process.env.PORT` for platforms like Render, Railway, or Heroku

## Installation

Copy the `trip-http` folder into your project, then install peer dependencies if you plan to use middleware packages:

```bash
npm install helmet cors
```

Trip itself has no runtime dependencies.

## Quick start

```js
import { Trip } from "./index.js";

const app = new Trip(3000);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen();
```

```bash
node example.js
# Server running at http://localhost:3000/
```

## Using middleware (helmet, cors, or your own)

```js
import { Trip } from "./index.js";
import helmet from "helmet";
import cors from "cors";

const app = new Trip(3000);

app.use(helmet());          // adds security headers
app.use(cors());            // enables cross-origin requests

app.use((req, res, next) => {
  console.log(`${req.method} ${req.pathname}`);
  next();
});

app.get("/", (req, res) => res.send("Hello"));

app.listen();
```

Middleware runs in the order it's registered, before any route handler. If a middleware ends the response itself (like a CORS preflight `OPTIONS` request), Trip stops the pipeline there and never reaches route matching.

## Routing

```js
app.get("/users", (req, res) => {
  res.send({ users: ["hg", "juan"] });
});

app.post("/users", (req, res) => {
  res.send({ created: req.body });
});

app.patch("/users/1", (req, res) => {
  res.send({ patched: req.body });
});
```

Handlers can either call `res.send()`/`res.json()` directly, or simply `return` a value:

```js
app.get("/json", (req, res) => {
  return { message: "auto-sent" }; // equivalent to res.send({ message: "auto-sent" })
});
```

## Modular routing with Router

Split routes into separate files/modules using `Router`, then mount them onto the main app:

```js
import { Router } from "./index.js";

export const userRouter = new Router("/users");

userRouter.get("/", (req, res) => res.send({ users: ["hg"] }));
userRouter.get("/profile", (req, res) => res.send({ name: "hg" }));
```

```js
import { Trip } from "./index.js";
import { userRouter } from "./routes/users.js";

const app = new Trip(3000);
app.use(userRouter); // routes now live under /users and /users/profile

app.listen();
```

`Router` instances can be created as many times as needed — each one is independent until merged with `.use()`.

## Request object

| Property | Description |
|---|---|
| `req.pathname` | The URL path, without query string |
| `req.query` | Parsed query string parameters as a plain object |
| `req.body` | Parsed JSON body (POST/PUT/PATCH only) |
| `req.params` | Reserved for future `:id`-style route params |

## Response object

| Method | Description |
|---|---|
| `res.send(data)` | Sends a response; auto-detects JSON vs. plain text |
| `res.json(data)` | Sends a response as JSON explicitly |
| `res.status(code)` | Sets the status code, chainable — `res.status(404).send(...)` |

## Error handling

- Thrown errors inside a route handler are caught automatically and return `500 Internal Server Error`
- Malformed JSON bodies return `400 Bad Request` instead of crashing the server
- Unmatched routes return `404 Not Found`

## Deploying to a cloud platform (Render, Railway, etc.)

Cloud platforms assign their own port and require binding to all network interfaces:

```js
const port = process.env.PORT || 3000;
const app = new Trip(port, "0.0.0.0");
```

Make sure your `package.json` has a start script:

```json
"scripts": {
  "start": "node example.js"
}
```

## Project structure

```
trip-http/
├── index.js          # public entry point — exports Trip and Router
├── src/
│   ├── server.js      # the Trip class — ties everything together
│   ├── router.js      # route registration and matching
│   ├── request.js     # request enhancement and body parsing
│   ├── response.js    # response enhancement (send/json/status)
│   └── middleware.js  # middleware chain runner
├── example.js
└── package.json
```

## Roadmap

- Route params (`/users/:id`)
- Static file serving
- Route-level middleware (`app.get(path, middleware, handler)`)
- Decorator-based controller syntax (NestJS-style), as an optional layer on top of the core

