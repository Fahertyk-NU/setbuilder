import { db } from "../db.js";

export function registerWorkoutRoutes(app) {
  // GET /api/workouts - fetch all workout plans
  app.get("/api/workouts", async (_req, res) => {
    try {
      const workouts = await db.collection("workouts").find({}).toArray();
      res.json(workouts);
    } catch (err) {
      // Log the real error so it appears in server logs for debugging
      console.error(err);
      res.status(500).json({ error: "Failed to fetch workout plans" });
    }
  });

  // POST /api/workouts - create a new workout plan
  app.post("/api/workouts", async (req, res) => {
    try {
      const workout = req.body;
      const result = await db.collection("workouts").insertOne(workout);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create workout plan" });
    }
  });

  // DELETE /api/workouts/:id - delete a workout plan
  app.delete("/api/workouts/:id", async (req, res) => {
    try {
      const { ObjectId } = await import("mongodb");
      const id = new ObjectId(req.params.id);
      const result = await db.collection("workouts").deleteOne({ _id: id });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete workout plan" });
    }
  });

  // PUT /api/workouts/:id - update a specific workouts by ID
  app.put("/api/workouts/:id", async (req, res) => {
    try {
      const { ObjectId } = await import("mongodb");
      const id = new ObjectId(req.params.id);
      const update = req.body;
      const result = await db
        .collection("workouts")
        .updateOne({ _id: id }, { $set: update });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update workouts" });
    }
  });

  // GET /api/workouts/:id - fetch a specific workouts by ID
  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const { ObjectId } = await import("mongodb");
      const id = new ObjectId(req.params.id);
      const workout = await db.collection("workouts").findOne({ _id: id });
      res.json(workout);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch this workout plan" });
    }
  });
}
