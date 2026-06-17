import { MongoClient } from "mongodb";

export let db;

export async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  db = client.db("setbuilder");
  console.log("Connected to MongoDB");
}
