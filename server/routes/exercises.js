import { db } from "../db.js";

export function registerExerciseRoutes(app) {
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

  // GET /api/exercises/random - get random exercises based on optional filters
  app.get("/api/exercises/random", async (req, res) => {
    try {
      const { equipment, level, count } = req.query;
      const match = {};

      // Handle single or multiple body part values
      let bodyParts = req.query.bodyPart;
      if (bodyParts) {
        if (!Array.isArray(bodyParts)) bodyParts = [bodyParts];
        match.BodyPart = { $in: bodyParts };
      }

      if (equipment) match.Equipment = equipment;
      if (level) match.Level = level;

      const exercises = await db
        .collection("exercises")
        .aggregate([
          { $match: match },
          { $sample: { size: parseInt(count) || 6 } },
        ])
        .toArray();

      res.json(exercises);
    } catch (_error) {
      res.status(500).json({ error: "Failed to generate workout" });
    }
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
}
