'use client';

import type { ProductVariantDto } from '@/lib/api';

interface VariantSelectorProps {
  variants: ProductVariantDto[];
  selectedId: string | null;
  onSelect: (variant: ProductVariantDto) => void;
}

export default function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps): React.JSX.Element {
  // Group variants by name dimension (e.g. "Size", "Color")
  const groups = variants.reduce<Record<string, ProductVariantDto[]>>((acc, v) => {
    const existing = acc[v.name];
    if (existing !== undefined) {
      existing.push(v);
    } else {
      acc[v.name] = [v];
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([dimensionName, options]) => (
        <div key={dimensionName}>
          <p className="mb-2 text-sm font-medium text-gray-700">{dimensionName}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((variant) => {
              const isSelected = variant.id === selectedId;
              const isOutOfStock = variant.stock === 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onSelect(variant)}
                  aria-pressed={isSelected}
                  className={[
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500',
                    isOutOfStock ? 'cursor-not-allowed opacity-40 line-through' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {variant.value}
                  {variant.priceDelta !== 0 && (
                    <span className="ml-1 text-xs opacity-75">
                      ({variant.priceDelta > 0 ? '+' : ''}${variant.priceDelta.toFixed(2)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
