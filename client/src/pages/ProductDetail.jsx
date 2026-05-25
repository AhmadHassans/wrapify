import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Cart from '../components/Cart.jsx';
import Reveal from '../components/Reveal.jsx';
import { api, imgUrl, thumbUrl } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';

const swatchHex = (name) => {
  const map = {
    pink: '#ffb6c1', white: '#ffffff', rose: '#e89bb0', oud: '#7a5230',
    vanilla: '#f6e2bc', red: '#ef4444', blue: '#60a5fa', green: '#86efac',
    yellow: '#fde68a', purple: '#c084fc', black: '#1f2937'
  };
  return map[(name || '').toLowerCase()] || '#e89bb0';
};

const variantColor = (v) => v?.hex || swatchHex(v?.color);

const SECTION_LABELS = { featured: 'Featured Goodies', packaging: 'Packaging Options', addons: 'Cute Add-ons' };

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const fromSection = loc.state?.from && SECTION_LABELS[loc.state.from] ? loc.state.from : 'featured';
  const fromLabel = SECTION_LABELS[fromSection];
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const [imgIdx, setImgIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setImgIdx(0); setVariantIdx(0); setSizeIdx(0); setQty(1);
    api.get(`/api/products/${id}`)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    api.get('/api/products').then(list => setRelated(list.filter(p => p.id !== Number(id) && !p.is_addon && !p.packaging_type).slice(0, 4))).catch(() => {});
  }, [id]);

  const variant = product?.variants?.[variantIdx] || null;
  const size = product?.sizes?.[sizeIdx] || null;
  const displayImage = useMemo(() => {
    if (variant?.image) return variant.image;
    return product?.images?.[imgIdx] || product?.images?.[0] || '';
  }, [variant, product, imgIdx]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const base = size ? Number(size.price) : Number(product.price) || 0;
    const add = variant ? Number(variant.price_add) || 0 : 0;
    return base + add;
  }, [product, size, variant]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, variant, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const buyNow = () => {
    if (!product) return;
    addItem(product, variant, size, qty);
    nav('/build');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div className="section">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square shimmer rounded-3xl" />
            <div className="space-y-3">
              <div className="h-10 w-3/4 shimmer rounded" />
              <div className="h-6 w-1/2 shimmer rounded" />
              <div className="h-20 shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div className="section text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="font-display text-3xl mb-2">Product not found</h1>
          <Link to="/" className="btn-primary mt-4">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8">
        <nav className="text-sm text-wrap-plum/60 mb-6">
          <Link to="/" className="hover:text-wrap-rose">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/" state={{ scrollTo: fromSection }} className="hover:text-wrap-rose">{fromLabel}</Link>
          <span className="mx-2">›</span>
          <span className="text-wrap-plum">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          <Reveal>
            <div className="space-y-4">
              <div className="relative aspect-square bg-gradient-to-br from-wrap-blush to-wrap-cream rounded-3xl overflow-hidden shadow-soft">
                {displayImage && (
                  <img
                    src={imgUrl(displayImage)}
                    alt={product.name}
                    decoding="async"
                    fetchpriority="high"
                    width="1200"
                    height="1200"
                    className="w-full h-full object-cover animate-fadeIn"
                  />
                )}
                {product.deals && (
                  <span className="absolute top-4 left-4 chip bg-gradient-to-r from-wrap-pink to-wrap-rose text-white shadow-pop font-semibold animate-pulseSoft">
                    {product.deals}
                  </span>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === imgIdx ? 'border-wrap-rose shadow-pop scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={thumbUrl(img)} alt="" loading="lazy" decoding="async" width="80" height="80" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div>
              {product.label && (
                <span className={`chip mb-3 ${product.label === 'Premium' ? 'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-700'}`}>
                  {product.label}
                </span>
              )}
              <h1 className="font-display text-4xl md:text-5xl text-wrap-plum mb-3">{product.name}</h1>
              <div className="font-display text-3xl text-wrap-rose font-semibold mb-4 animate-pulseSoft">
                Rs.{unitPrice}
              </div>
              <p className="text-wrap-plum/75 mb-6 leading-relaxed">{product.description}</p>

              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-5">
                  <div className="text-sm font-medium text-wrap-plum mb-2">Size</div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSizeIdx(i)}
                        className={`px-4 py-2 rounded-pill border-2 text-sm transition-all ${i === sizeIdx ? 'border-wrap-rose bg-wrap-rose text-white shadow-soft' : 'border-wrap-pink/40 bg-white text-wrap-plum hover:border-wrap-rose'}`}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className={`ml-2 text-xs ${i === sizeIdx ? 'opacity-90' : 'opacity-70'}`}>Rs.{s.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants && product.variants.length > 0 && (
                <div className="mb-5">
                  <div className="text-sm font-medium text-wrap-plum mb-2">
                    Color: <span className="text-wrap-rose">{variant?.color}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => setVariantIdx(i)}
                        title={v.color}
                        style={{ background: variantColor(v) }}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${i === variantIdx ? 'border-wrap-rose scale-110 shadow-pop' : 'border-white shadow-soft hover:scale-105'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="text-sm font-medium text-wrap-plum mb-2">Quantity</div>
                <div className="inline-flex items-center gap-3 bg-white rounded-pill border border-wrap-pink/40 px-2 py-1 shadow-soft">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full bg-wrap-blush hover:bg-wrap-pink/40 transition">−</button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-full bg-wrap-blush hover:bg-wrap-pink/40 transition">+</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={handleAdd} className={`btn-primary ${added ? '!bg-none !bg-emerald-500' : ''}`}>
                  {added ? 'Added ✓' : <>Add to Hamper <span className="ml-1">💖</span></>}
                </button>
                <button onClick={buyNow} className="btn-outline">
                  Buy Now ✨
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-wrap-rose/10 grid grid-cols-2 gap-4 text-center text-xs text-wrap-plum/70">
                <div>🎁<div className="mt-1">Gift wrapped</div></div>
                <div>💌<div className="mt-1">Custom note</div></div>
              </div>
            </div>
          </Reveal>
        </div>

        {related.length > 0 && (
          <section className="section">
            <Reveal>
              <div className="mb-8">
                <div className="text-xs uppercase tracking-[0.25em] text-wrap-rose/80 mb-2">✦ You may also like</div>
                <h2 className="font-display text-3xl md:text-4xl"><span className="text-gradient">More</span> goodies</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
