import express from "express";
import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db("setbuilder");
  console.log("Connected to MongoDB");
}

// GET /api/exercises - fetch exercises with optional filters
app.get("/api/exercises", async (req, res) => {
  try {
    const { bodyPart, equipment, level, search } = req.query;
    const query = {};

    if (bodyPart) query.BodyPart = bodyPart;
    if (equipment) query.Equipment = equipment;
    if (level) query.Level = level;
    if (search) query.Title = { $regex: search, $options: "i" };

    const exercises = await db
      .collection("exercises")
      .find(query)
      .limit(20)
      .toArray();
    res.json(exercises);
  } catch (_error) {
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

// GET distinct body parts
app.get("/api/bodyparts", async (req, res) => {
  const values = await db.collection("exercises").distinct("BodyPart");
  res.json(values.sort());
});

// GET distinct equipment
app.get("/api/equipment", async (req, res) => {
  const values = await db.collection("exercises").distinct("Equipment");
  res.json(values.sort());
});

// POST /api/exercises - add a new exercise to the database
app.post("/api/exercises", async (req, res) => {
  try {
    const exercise = req.body;
    const result = await db.collection("exercises").insertOne(exercise);
    res.json(result);
  } catch (_error) {
    res.status(500).json({ error: "Failed to add exercise" });
  }
});

// PUT /api/exercises/:id - update a specific exercise by ID
app.put("/api/exercises/:id", async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const id = new ObjectId(req.params.id);
    const update = req.body;
    const result = await db
      .collection("exercises")
      .updateOne({ _id: id }, { $set: update });
    res.json(result);
  } catch (_error) {
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

// DELETE /api/exercises/:id - remove a specific exercise by ID
app.delete("/api/exercises/:id", async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const id = new ObjectId(req.params.id);
    const result = await db.collection("exercises").deleteOne({ _id: id });
    res.json(result);
  } catch (_error) {
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
