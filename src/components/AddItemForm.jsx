import { useState } from "react";

const CATEGORIES = [
  { value: "sight", label: "Sight" },
  { value: "museum", label: "Museum" },
  { value: "activity", label: "Activity" },
  { value: "food", label: "Food & Drink" }
];

export default function AddItemForm({ city, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    category: "sight",
    name: "",
    cost: "",
    location: "",
    duration: "",
    description: ""
  });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, city });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2>Add your own idea</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Name *</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Walk the High Line" required />
        </div>
        <div className="form-field">
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Cost</label>
          <input name="cost" value={form.cost} onChange={handleChange} placeholder="e.g. Free, $30" />
        </div>
        <div className="form-field">
          <label>Location</label>
          <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Chelsea, Manhattan" />
        </div>
        <div className="form-field">
          <label>Time needed</label>
          <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 1–2 hrs" />
        </div>
        <div className="form-field full-width">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What's it like? Why do you want to go?"
            rows={3}
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Add to list</button>
      </div>
    </form>
  );
}
