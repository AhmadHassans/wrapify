import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { imgUrl, thumbUrl } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';

const labelClass = (label) => {
  if (label === 'Budget Friendly') return 'bg-emerald-100/90 text-emerald-700 backdrop-blur-sm';
  if (label === 'Premium') return 'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900';
  return 'bg-wrap-blush text-wrap-plum';
};

const swatchHex = (name) => {
  const map = {
    pink: '#ffb6c1', white: '#ffffff', rose: '#e89bb0', oud: '#7a5230',
    vanilla: '#f6e2bc', red: '#ef4444', blue: '#60a5fa', green: '#86efac',
    yellow: '#fde68a', purple: '#c084fc', black: '#1f2937'
  };
  return map[(name || '').toLowerCase()] || '#e89bb0';
};

const variantColor = (v) => v?.hex || swatchHex(v?.color);

export default function ProductCard({ product, compact = false }) {
  const { addItem } = useCart();
  const [variantIdx, setVariantIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [bursting, setBursting] = useState(false);

  const hasVariants = product.variants && product.variants.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const selectedVariant = hasVariants ? product.variants[variantIdx] : null;
  const defaultSize = hasSizes ? product.sizes[0] : null;
  const displayImage = useMemo(() => {
    if (selectedVariant?.image) return selectedVariant.image;
    return product.images?.[imgIdx] || product.images?.[0] || '';
  }, [selectedVariant, product.images, imgIdx]);

  const priceDisplay = useMemo(() => {
    if (hasSizes) {
      const prices = product.sizes.map(s => Number(s.price) || 0);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max) return `Rs.${min}`;
      return `Rs.${min} – Rs.${max}`;
    }
    return `Rs.${Number(product.price) + (selectedVariant?.price_add || 0)}`;
  }, [hasSizes, product, selectedVariant]);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, selectedVariant, defaultSize, 1);
    setAdded(true);
    setBursting(true);
    setTimeout(() => setBursting(false), 700);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleSwatch = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    setVariantIdx(i);
  };

  const handleDot = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx(i);
  };

  return (
    <Link to={`/product/${product.id}`} className="block">
      <div className="card group hover:shadow-pop hover:-translate-y-2 transition-all duration-500">
        <div className="relative aspect-square bg-gradient-to-br from-wrap-blush to-wrap-cream overflow-hidden">
          {displayImage && (
            <img
              src={thumbUrl(displayImage)}
              srcSet={`${thumbUrl(displayImage)} 400w, ${imgUrl(displayImage)} 1200w`}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              alt={product.name}
              loading="lazy"
              decoding="async"
              width="400"
              height="400"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {product.deals && (
            <span className="absolute top-3 left-3 chip bg-gradient-to-r from-wrap-pink to-wrap-rose text-white shadow-soft font-semibold animate-pulseSoft">
              {product.deals}
            </span>
          )}
          {product.label && (
            <span className={`absolute top-3 right-3 chip ${labelClass(product.label)} shadow-soft`}>
              {product.label}
            </span>
          )}

          {product.images && product.images.length > 1 && !selectedVariant && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-md rounded-full px-2 py-1">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => handleDot(e, i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === imgIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          )}

          {bursting && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {['💖', '✨', '🎀'].map((e, i) => (
                <span key={i} className="absolute text-3xl" style={{ animation: 'floatSlow 0.7s ease-out forwards', transform: `translate(${(i - 1) * 40}px, 0)`, opacity: 1 }}>{e}</span>
              ))}
            </div>
          )}
        </div>

        <div className={`p-4 ${compact ? '' : 'md:p-5'}`}>
          <h3 className="font-display text-lg leading-tight group-hover:text-wrap-rose transition-colors">{product.name}</h3>
          {!compact && product.description && (
            <p className="text-sm text-wrap-plum/70 mt-1 line-clamp-2">{product.description}</p>
          )}

          {hasVariants && (
            <div className="mt-3 flex items-center gap-2">
              {product.variants.map((v, i) => (
                <button
                  key={i}
                  onClick={(e) => handleSwatch(e, i)}
                  title={v.color}
                  style={{ background: variantColor(v) }}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${i === variantIdx ? 'border-wrap-rose scale-110 shadow-pop' : 'border-white shadow-soft hover:scale-105'}`}
                />
              ))}
            </div>
          )}

          {hasSizes && (
            <div className="mt-2 text-xs text-wrap-plum/60">
              {product.sizes.length} size{product.sizes.length === 1 ? '' : 's'} available
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="font-display text-xl text-wrap-rose font-semibold">{priceDisplay}</div>
            <button
              onClick={handleAdd}
              className={`btn-primary text-sm px-4 py-2 ${added ? '!bg-none !bg-emerald-500' : ''}`}
            >
              {added ? 'Added ✓' : <>Add <span className="ml-1">💖</span></>}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
