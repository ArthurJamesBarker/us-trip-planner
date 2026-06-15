export default function StarRating({ value, onChange, disabled = false }) {
  return (
    <div className={`star-rating ${disabled ? "readonly" : ""}`} role="group" aria-label="How much do you want to do this?">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? "filled" : ""}`}
          onClick={() => !disabled && onChange(star === value ? 0 : star)}
          disabled={disabled}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          title={star === 1 ? "Not bothered" : star === 5 ? "Must do!" : `${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
