'use client';

interface QuickAddButtonProps {
  productId: string;
  productName: string;
}

export default function QuickAddButton({
  productId,
  productName,
}: QuickAddButtonProps): React.JSX.Element {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    // Cart integration placeholder — will be wired to cart context in spec-05
    console.log('Quick add:', productId);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      aria-label={`Quick add ${productName} to cart`}
    >
      Quick Add
    </button>
  );
}
