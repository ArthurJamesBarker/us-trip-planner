import { useState, useEffect, useCallback } from "react";
import StarRating from "./components/StarRating";
import AddItemForm from "./components/AddItemForm";
import ItemCard from "./components/ItemCard";

const CITIES = {
  "new-york": { label: "New York", emoji: "🗽" },
  "washington-dc": { label: "Washington DC", emoji: "🏛️" }
};

const CATEGORIES = {
  sight: "Sights",
  museum: "Museums",
  activity: "Activities",
  food: "Food & Drink"
};

function getTripIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("trip");
}

function setTripIdInUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("trip", id);
  window.history.replaceState({}, "", url);
}

export default function App() {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState("new-york");
  const [category, setCategory] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  const loadTrip = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/trips/${id}`);
      if (!res.ok) throw new Error("Trip not found");
      const data = await res.json();
      setTrip(data);
      setError(null);
    } catch {
      setError("Could not load trip. The link may be invalid.");
    }
  }, []);

  const createTrip = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Dad & Me — US Trip" })
      });
      const data = await res.json();
      setTripIdInUrl(data.id);
      await loadTrip(data.id);
    } catch {
      setError("Could not create trip. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [loadTrip]);

  useEffect(() => {
    async function init() {
      const id = getTripIdFromUrl();
      if (id) {
        await loadTrip(id);
      } else {
        await createTrip();
      }
      setLoading(false);
    }
    init();
  }, [createTrip, loadTrip]);

  useEffect(() => {
    const id = trip?.id;
    if (!id) return;

    const interval = setInterval(() => loadTrip(id), 5000);
    return () => clearInterval(interval);
  }, [trip?.id, loadTrip]);

  async function updateRating(itemId, rating) {
    const res = await fetch(`/api/trips/${trip.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating })
    });
    if (res.ok) {
      const updated = await res.json();
      setTrip((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? updated : i))
      }));
    }
  }

  async function addItem(item) {
    const res = await fetch(`/api/trips/${trip.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (res.ok) {
      const newItem = await res.json();
      setTrip((prev) => ({ ...prev, items: [...prev.items, newItem] }));
      setShowAddForm(false);
    }
  }

  async function deleteItem(itemId) {
    const res = await fetch(`/api/trips/${trip.id}/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      setTrip((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId)
      }));
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your trip planner…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <button onClick={createTrip}>Start a new trip</button>
      </div>
    );
  }

  const filtered = trip.items
    .filter((i) => i.city === city)
    .filter((i) => category === "all" || i.category === category)
    .filter((i) => i.rating >= minRating)
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating || a.name.localeCompare(b.name);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const cityCounts = trip.items.filter((i) => i.city === city);
  const ratedCount = cityCounts.filter((i) => i.rating > 0).length;
  const topRated = cityCounts.filter((i) => i.rating >= 4).length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>US Trip Planner</h1>
            <p className="subtitle">New York & Washington DC with Dad</p>
          </div>
          <button className="share-btn" onClick={copyLink}>
            {copied ? "✓ Link copied!" : "📋 Share with Dad"}
          </button>
        </div>
        <p className="share-hint">
          Send him this link — any changes you both make update live.
        </p>
      </header>

      <nav className="city-tabs">
        {Object.entries(CITIES).map(([key, { label, emoji }]) => (
          <button
            key={key}
            className={`city-tab ${city === key ? "active" : ""}`}
            onClick={() => setCity(key)}
          >
            <span className="tab-emoji">{emoji}</span>
            {label}
            <span className="tab-count">
              {trip.items.filter((i) => i.city === key && i.rating >= 4).length} must-dos
            </span>
          </button>
        ))}
      </nav>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-num">{cityCounts.length}</span>
          <span className="stat-label">ideas</span>
        </div>
        <div className="stat">
          <span className="stat-num">{ratedCount}</span>
          <span className="stat-label">rated</span>
        </div>
        <div className="stat highlight">
          <span className="stat-num">{topRated}</span>
          <span className="stat-label">must-dos (4+★)</span>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Min rating</label>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>Any</option>
            <option value={1}>1+ stars</option>
            <option value={2}>2+ stars</option>
            <option value={3}>3+ stars</option>
            <option value={4}>4+ stars (must-dos)</option>
            <option value={5}>5 stars only</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rating">Rating (high first)</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
        <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "+ Add your own"}
        </button>
      </div>

      {showAddForm && (
        <AddItemForm city={city} onSubmit={addItem} onCancel={() => setShowAddForm(false)} />
      )}

      <main className="items-list">
        {filtered.length === 0 ? (
          <p className="empty-state">No items match your filters. Try lowering the minimum rating.</p>
        ) : (
          filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              categoryLabel={CATEGORIES[item.category]}
              onRate={updateRating}
              onDelete={item.is_custom ? () => deleteItem(item.id) : null}
            />
          ))
        )}
      </main>

      <footer className="footer">
        <p>Updates every 5 seconds · Trip ID: {trip.id}</p>
      </footer>
    </div>
  );
}
