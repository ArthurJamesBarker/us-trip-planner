export default function StarRating({ value, onChange }) {
  return (
    <div className="star-rating" role="group" aria-label="How much do you want to do this?">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? "filled" : ""}`}
          onClick={() => onChange(star === value ? 0 : star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          title={star === 1 ? "Not bothered" : star === 5 ? "Must do!" : `${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
