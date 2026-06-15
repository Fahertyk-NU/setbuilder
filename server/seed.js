// One-time seed script to load exercises from CSV into MongoDB
// Run with: node server/seed.js

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import "dotenv/config";

const client = new MongoClient(process.env.MONGO_URI);

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("setbuilder");
    const collection = db.collection("exercises");

    // Clear existing data
    await collection.deleteMany({});
    console.log("Cleared existing exercises");

    // Read and parse CSV
    const fileContent = readFileSync("./data/megaGymDataset.csv", "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Insert all records
    const result = await collection.insertMany(records);
    console.log(`Inserted ${result.insertedCount} exercises`);
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await client.close();
  }
}

seed();
