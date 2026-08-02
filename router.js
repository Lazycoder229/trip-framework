import {Router} from "./index.js";
// --- users module: sarili niyang Router instance ---
const userRouter = new Router("/users");

userRouter.get("/", (req, res) => {
  res.send("hello from user");
});

export default userRouter;