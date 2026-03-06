interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({
  rating,
  max = 5,
  size = 'md',
}: StarRatingProps): React.JSX.Element {
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClass}`} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <span key={`star-${i}-of-${max}`} aria-hidden="true" className={filled || partial ? 'text-amber-400' : 'text-gray-300'}>
            {filled ? '★' : partial ? '½' : '☆'}
          </span>
        );
      })}
    </span>
  );
}
