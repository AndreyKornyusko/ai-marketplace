'use client';

import { useCart } from '@/contexts/CartContext';

interface QuickAddButtonProps {
  productId: string;
  productName: string;
  price: number;
  imageUrl: string | null;
  maxQuantity: number;
}

export default function QuickAddButton({
  productId,
  productName,
  price,
  imageUrl,
  maxQuantity,
}: QuickAddButtonProps): React.JSX.Element {
  const { addItem } = useCart();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId, variantId: null, name: productName, price, imageUrl, maxQuantity });
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
