import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { seedItems } from "./seed-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

const db = new Database(path.join(__dirname, "trips.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Our US Trip',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    city TEXT NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    cost TEXT NOT NULL,
    location TEXT NOT NULL,
    duration TEXT NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 0,
    rating_me INTEGER NOT NULL DEFAULT 0,
    rating_dad INTEGER NOT NULL DEFAULT 0,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  );
`);

const itemColumns = db.prepare("PRAGMA table_info(items)").all().map((c) => c.name);
if (!itemColumns.includes("rating_me")) {
  db.exec("ALTER TABLE items ADD COLUMN rating_me INTEGER NOT NULL DEFAULT 0");
  db.exec("ALTER TABLE items ADD COLUMN rating_dad INTEGER NOT NULL DEFAULT 0");
  db.exec("UPDATE items SET rating_me = rating WHERE rating > 0");
}

const app = express();
app.use(cors());
app.use(express.json());

function seedTrip(tripId) {
  const insert = db.prepare(`
    INSERT INTO items (id, trip_id, city, category, name, cost, location, duration, description, is_custom)
    VALUES (@id, @tripId, @city, @category, @name, @cost, @location, @duration, @description, 0)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({ ...item, id: nanoid(10), tripId });
    }
  });

  insertMany(seedItems);
}

app.post("/api/trips", (req, res) => {
  const id = nanoid(8);
  const name = req.body?.name || "Our US Trip";
  db.prepare("INSERT INTO trips (id, name) VALUES (?, ?)").run(id, name);
  seedTrip(id);
  res.json({ id, name });
});

app.get("/api/trips/:id", (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const items = db
    .prepare("SELECT * FROM items WHERE trip_id = ? ORDER BY city, category, name")
    .all(req.params.id);

  res.json({ ...trip, items });
});

app.patch("/api/trips/:id", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const result = db.prepare("UPDATE trips SET name = ? WHERE id = ?").run(name, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Trip not found" });
  res.json({ ok: true });
});

app.post("/api/trips/:id/items", (req, res) => {
  const trip = db.prepare("SELECT id FROM trips WHERE id = ?").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const { city, category, name, cost, location, duration, description } = req.body;
  if (!city || !category || !name) {
    return res.status(400).json({ error: "City, category, and name are required" });
  }

  const id = nanoid(10);
  db.prepare(`
    INSERT INTO items (id, trip_id, city, category, name, cost, location, duration, description, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    req.params.id,
    city,
    category,
    name,
    cost || "TBC",
    location || "TBC",
    duration || "TBC",
    description || ""
  );

  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
  res.status(201).json(item);
});

app.patch("/api/trips/:id/items/:itemId", (req, res) => {
  const { rating, user } = req.body;
  if (rating === undefined || rating < 0 || rating > 5) {
    return res.status(400).json({ error: "Rating must be 0–5" });
  }
  if (user !== "arthur" && user !== "me" && user !== "dad") {
    return res.status(400).json({ error: "User must be 'arthur' or 'dad'" });
  }

  const column = user === "dad" ? "rating_dad" : "rating_me";
  const result = db
    .prepare(`UPDATE items SET ${column} = ? WHERE id = ? AND trip_id = ?`)
    .run(rating, req.params.itemId, req.params.id);

  db.prepare(`
    UPDATE items SET rating = MAX(rating_me, rating_dad)
    WHERE id = ? AND trip_id = ?
  `).run(req.params.itemId, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: "Item not found" });
  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.itemId);
  res.json(item);
});

app.delete("/api/trips/:id/items/:itemId", (req, res) => {
  const item = db
    .prepare("SELECT * FROM items WHERE id = ? AND trip_id = ?")
    .get(req.params.itemId, req.params.id);

  if (!item) return res.status(404).json({ error: "Item not found" });
  if (!item.is_custom) return res.status(403).json({ error: "Can only delete custom items" });

  db.prepare("DELETE FROM items WHERE id = ?").run(req.params.itemId);
  res.json({ ok: true });
});

if (isProd) {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Trip planner running on port ${PORT}`);
});
