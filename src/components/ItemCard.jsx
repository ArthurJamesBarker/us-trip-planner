import StarRating from "./StarRating";

const CATEGORY_COLORS = {
  sight: "cat-sight",
  museum: "cat-museum",
  activity: "cat-activity",
  food: "cat-food"
};

export default function ItemCard({
  item,
  categoryLabel,
  currentUser,
  onRate,
  onDelete,
  compact = false
}) {
  const meRating = item.rating_me ?? 0;
  const dadRating = item.rating_dad ?? 0;
  const bothLove = meRating === 5 && dadRating === 5;

  if (compact) {
    return (
      <div className="mutual-item">
        <span className={`category-badge ${CATEGORY_COLORS[item.category]}`}>
          {categoryLabel}
        </span>
        <span className="mutual-item-name">{item.name}</span>
        <span className="mutual-item-meta">{item.duration} · {item.cost}</span>
      </div>
    );
  }

  return (
    <article className={`item-row ${bothLove ? "both-love" : meRating >= 4 || dadRating >= 4 ? "must-do" : ""}`}>
      <div className="item-main">
        <div className="item-title-row">
          <span className={`category-badge ${CATEGORY_COLORS[item.category]}`}>
            {categoryLabel}
          </span>
          {item.is_custom && <span className="custom-badge">Your pick</span>}
          {bothLove && <span className="both-badge">Both ★★★★★</span>}
          <h3 className="item-name">{item.name}</h3>
        </div>
        <p className="item-description">{item.description}</p>
      </div>

      <div className="item-details">
        <span className="detail-chip">💰 {item.cost}</span>
        <span className="detail-chip">📍 {item.location}</span>
        <span className="detail-chip">⏱ {item.duration}</span>
      </div>

      <div className="item-ratings">
        <div className={`rating-row ${currentUser === "arthur" ? "active-user" : ""}`}>
          <span className="rating-person">Arthur</span>
          <StarRating
            value={meRating}
            onChange={(r) => onRate(item.id, "arthur", r)}
            disabled={currentUser !== "arthur"}
          />
        </div>
        <div className={`rating-row ${currentUser === "dad" ? "active-user" : ""}`}>
          <span className="rating-person">Dad</span>
          <StarRating
            value={dadRating}
            onChange={(r) => onRate(item.id, "dad", r)}
            disabled={currentUser !== "dad"}
          />
        </div>
      </div>

      {onDelete && (
        <button className="delete-btn" onClick={onDelete} title="Remove">
          ✕
        </button>
      )}
    </article>
  );
}
