import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing from the backend environment.");
  process.exit(1);
}

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Favor API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Could not start the server:", error.message);
    process.exit(1);
  });
