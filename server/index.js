import express from "express";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { connectDB } from "./db.js";
import { registerExerciseRoutes } from "./routes/exercises.js";
import { registerWorkoutRoutes } from "./routes/workouts.js";

dotenv.config();

//Use __dirname since ES modules don't have it automatically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON request bodies
app.use(express.json());
// Serve frontend files from the public folder
app.use(express.static(join(__dirname, "../public")));

registerExerciseRoutes(app);
registerWorkoutRoutes(app);

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
