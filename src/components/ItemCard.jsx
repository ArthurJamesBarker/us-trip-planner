import StarRating from "./StarRating";

const CATEGORY_COLORS = {
  sight: "cat-sight",
  museum: "cat-museum",
  activity: "cat-activity",
  food: "cat-food"
};

export default function ItemCard({ item, categoryLabel, onRate, onDelete }) {
  return (
    <article className={`item-row ${item.rating >= 4 ? "must-do" : ""}`}>
      <div className="item-main">
        <div className="item-title-row">
          <span className={`category-badge ${CATEGORY_COLORS[item.category]}`}>
            {categoryLabel}
          </span>
          {item.is_custom && <span className="custom-badge">Your pick</span>}
          <h3 className="item-name">{item.name}</h3>
        </div>
        <p className="item-description">{item.description}</p>
      </div>

      <div className="item-details">
        <span className="detail-chip">💰 {item.cost}</span>
        <span className="detail-chip">📍 {item.location}</span>
        <span className="detail-chip">⏱ {item.duration}</span>
      </div>

      <div className="item-actions">
        <StarRating value={item.rating} onChange={(r) => onRate(item.id, r)} />
        {onDelete && (
          <button className="delete-btn" onClick={onDelete} title="Remove">
            ✕
          </button>
        )}
      </div>
    </article>
  );
}
