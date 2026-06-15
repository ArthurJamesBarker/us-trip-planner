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

function getStoredUser() {
  return localStorage.getItem("tripUser");
}

function storeUser(user) {
  localStorage.setItem("tripUser", user);
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
  const [currentUser, setCurrentUser] = useState(getStoredUser);

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

  function selectUser(user) {
    storeUser(user);
    setCurrentUser(user);
  }

  async function updateRating(itemId, user, rating) {
    const res = await fetch(`/api/trips/${trip.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, user })
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

  function copyLink(forDad = false) {
    const url = new URL(window.location.href);
    navigator.clipboard.writeText(url.toString());
    setCopied(forDad ? "dad" : "me");
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

  if (!currentUser) {
    return (
      <div className="user-pick-screen">
        <h1>Who are you?</h1>
        <p>Pick your name so your ratings are saved separately from Dad's.</p>
        <div className="user-pick-buttons">
          <button className="user-pick-btn" onClick={() => selectUser("me")}>
            Me
          </button>
          <button className="user-pick-btn dad" onClick={() => selectUser("dad")}>
            Dad
          </button>
        </div>
      </div>
    );
  }

  const cityItems = trip.items.filter((i) => i.city === city);

  const mutualFives = cityItems.filter(
    (i) => (i.rating_me ?? 0) === 5 && (i.rating_dad ?? 0) === 5
  );

  const filtered = cityItems
    .filter((i) => category === "all" || i.category === category)
    .filter((i) => {
      if (minRating === 0) return true;
      const me = i.rating_me ?? 0;
      const dad = i.rating_dad ?? 0;
      if (minRating === 6) return me === 5 && dad === 5;
      return Math.max(me, dad) >= minRating;
    })
    .sort((a, b) => {
      const aBoth = (a.rating_me === 5 && a.rating_dad === 5) ? 1 : 0;
      const bBoth = (b.rating_me === 5 && b.rating_dad === 5) ? 1 : 0;
      if (bBoth !== aBoth) return bBoth - aBoth;
      const aMax = Math.max(a.rating_me ?? 0, a.rating_dad ?? 0);
      const bMax = Math.max(b.rating_me ?? 0, b.rating_dad ?? 0);
      if (sortBy === "rating") return bMax - aMax || a.name.localeCompare(b.name);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const ratedByMe = cityItems.filter((i) => (i.rating_me ?? 0) > 0).length;
  const ratedByDad = cityItems.filter((i) => (i.rating_dad ?? 0) > 0).length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>US Trip Planner</h1>
            <p className="subtitle">New York & Washington DC with Dad</p>
          </div>
          <div className="header-actions">
            <div className="user-switcher">
              <span className="user-switcher-label">You are:</span>
              <button
                className={`user-chip ${currentUser === "me" ? "active" : ""}`}
                onClick={() => selectUser("me")}
              >
                Me
              </button>
              <button
                className={`user-chip ${currentUser === "dad" ? "active" : ""}`}
                onClick={() => selectUser("dad")}
              >
                Dad
              </button>
            </div>
            <button className="share-btn" onClick={() => copyLink(true)}>
              {copied ? "✓ Link copied!" : "📋 Share with Dad"}
            </button>
          </div>
        </div>
        <p className="share-hint">
          You are rating as <strong>{currentUser === "me" ? "Me" : "Dad"}</strong> — send Dad the link and ask him to pick "Dad" when he opens it.
        </p>
      </header>

      {mutualFives.length > 0 && (
        <section className="mutual-section">
          <h2>⭐ You both gave 5 stars</h2>
          <p className="mutual-subtitle">{CITIES[city].label} — definite must-dos</p>
          <div className="mutual-list">
            {mutualFives.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                categoryLabel={CATEGORIES[item.category]}
                currentUser={currentUser}
                compact
              />
            ))}
          </div>
        </section>
      )}

      <nav className="city-tabs">
        {Object.entries(CITIES).map(([key, { label, emoji }]) => {
          const bothCount = trip.items.filter(
            (i) => i.city === key && (i.rating_me ?? 0) === 5 && (i.rating_dad ?? 0) === 5
          ).length;
          return (
            <button
              key={key}
              className={`city-tab ${city === key ? "active" : ""}`}
              onClick={() => setCity(key)}
            >
              <span className="tab-emoji">{emoji}</span>
              {label}
              <span className="tab-count">
                {bothCount} both ★★★★★
              </span>
            </button>
          );
        })}
      </nav>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-num">{cityItems.length}</span>
          <span className="stat-label">ideas</span>
        </div>
        <div className="stat">
          <span className="stat-num">{ratedByMe}</span>
          <span className="stat-label">rated by me</span>
        </div>
        <div className="stat">
          <span className="stat-num">{ratedByDad}</span>
          <span className="stat-label">rated by dad</span>
        </div>
        <div className="stat highlight">
          <span className="stat-num">{mutualFives.length}</span>
          <span className="stat-label">both ★★★★★</span>
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
            <option value={1}>1+ stars (either)</option>
            <option value={3}>3+ stars (either)</option>
            <option value={4}>4+ stars (either)</option>
            <option value={5}>5 stars (either)</option>
            <option value={6}>Both gave 5 stars</option>
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
              currentUser={currentUser}
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
