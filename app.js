import { Trip } from "./index.js";

import  userRouter  from "./router.js";
const app = new Trip(3000);

// i-mount lahat papunta sa main app
app.use(userRouter);


// pwede pa rin direkta sa app kung gusto
app.get("/", (req, res) => {
  res.send("Trip server is running");
});

app.listen();