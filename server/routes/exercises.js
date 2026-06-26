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
    } catch (err) {
      // Log the real error so it appears in server logs for debugging
      console.error(err);
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
      const { level, count } = req.query;

      let bodyParts = req.query.bodyPart;
      if (bodyParts && !Array.isArray(bodyParts)) bodyParts = [bodyParts];

      let equipment = req.query.equipment;
      if (equipment && !Array.isArray(equipment)) equipment = [equipment];

      const totalCount = parseInt(count) || 6;

      // If body parts selected, get at least one per body part
      if (bodyParts && bodyParts.length > 0) {
        const perGroup = Math.max(1, Math.floor(totalCount / bodyParts.length));
        const remainder = totalCount - perGroup * bodyParts.length;

        let results = [];

        for (const bp of bodyParts) {
          const match = { BodyPart: bp };
          if (equipment && equipment.length > 0)
            match.Equipment = { $in: equipment };
          if (level) match.Level = level;

          const exercises = await db
            .collection("exercises")
            .aggregate([{ $match: match }, { $sample: { size: perGroup } }])
            .toArray();

          results = results.concat(exercises);
        }

        // Fill remainder randomly from all selected body parts
        if (remainder > 0) {
          const match = { BodyPart: { $in: bodyParts } };
          if (equipment && equipment.length > 0)
            match.Equipment = { $in: equipment };
          if (level) match.Level = level;

          const extra = await db
            .collection("exercises")
            .aggregate([{ $match: match }, { $sample: { size: remainder } }])
            .toArray();

          results = results.concat(extra);
        }

        // Fisher-Yates shuffle: unbiased O(n) algorithm that guarantees each
        // permutation is equally likely, unlike sort(() => Math.random() - 0.5)
        for (let i = results.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [results[i], results[j]] = [results[j], results[i]];
        }
        return res.json(results);
      }

      // No body parts selected — just sample randomly
      const match = {};
      if (equipment && equipment.length > 0)
        match.Equipment = { $in: equipment };
      if (level) match.Level = level;

      const exercises = await db
        .collection("exercises")
        .aggregate([{ $match: match }, { $sample: { size: totalCount } }])
        .toArray();

      res.json(exercises);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate workout" });
    }
  });

  // POST /api/exercises - add a new exercise to the database
  app.post("/api/exercises", async (req, res) => {
    try {
      const exercise = req.body;
      const result = await db.collection("exercises").insertOne(exercise);
      res.json(result);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  });
}
