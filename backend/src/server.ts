import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
console.log(`Connected to MongoDB (${mongoose.connection.name})`);

const server = createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

const shutdown = async () => {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
