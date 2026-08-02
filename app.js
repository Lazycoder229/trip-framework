import { Trip } from "./index.js";
import helmet from "helmet";
import cors from "cors";

const app = new Trip(3000);

app.use(helmet());  // nagdadagdag ng security headers (XSS protection, CSP, atbp)
app.use(cors());    // nagpapahintulot ng cross-origin requests mula sa lahat ng domain

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen();