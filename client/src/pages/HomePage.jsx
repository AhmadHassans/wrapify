import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Cart from '../components/Cart.jsx';
import Reveal from '../components/Reveal.jsx';
import { api, imgUrl } from '../lib/api.js';

const STEPS = [
  { icon: '🎯', title: 'Set Your Budget', desc: 'Tell us how much you want to spend.' },
  { icon: '🛍️', title: 'Choose Your Items', desc: 'Mix and match goodies for your loved one.' },
  { icon: '📦', title: 'We Pack & Deliver', desc: 'We wrap with love and deliver to your door.' }
];

const PACKAGING_LABELS = {
  basket: { name: 'Basket', emoji: '🧺' },
  gift_box: { name: 'Gift Box', emoji: '🎁' },
  transparent: { name: 'Transparent Box', emoji: '📦' },
  net: { name: 'Net Wrap', emoji: '🎀' }
};

const TRUST = [
  '✨ Handcrafted with love',
  '💌 Personalized notes',
  '🎀 Eid-ready packaging',
  '💖 Custom themes',
  '⚡ Same-day dispatch'
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    api.get('/api/products')
      .then(setProducts)
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const featured = products.filter(p => !p.is_addon && !p.packaging_type);
  const addons = products.filter(p => p.is_addon);
  const packagingProducts = products.filter(p => p.packaging_type);

  return (
    <div className="min-h-screen">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* HERO */}
      <section className="relative hero-bg">
        <div className="blob bg-wrap-pink w-[420px] h-[420px] -top-32 -left-32 animate-blob" />
        <div className="blob bg-wrap-lilac w-[380px] h-[380px] top-1/2 -right-32 animate-blob" style={{ animationDelay: '4s' }} />
        <div className="blob bg-wrap-dusty w-[300px] h-[300px] bottom-0 left-1/3 animate-blob" style={{ animationDelay: '8s' }} />
        <Confetti />
        <SparkleField />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-20 pb-28 md:pt-32 md:pb-40 text-center z-10">
          <span className="chip bg-white/70 text-wrap-rose mb-6 backdrop-blur-md border border-wrap-rose/20 shadow-soft animate-fadeIn">
            ✦ Orders open till 20th Eid · Limited slots ⏳
          </span>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] animate-fadeUp">
            <span className="text-gradient">Build it. Wrap it.</span>
            <br />
            <span className="text-wrap-plum">Gift it your way.</span>
            <span className="inline-block animate-float ml-2">🎁</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-wrap-plum/75 max-w-xl mx-auto animate-fadeUp italic" style={{ animationDelay: '120ms' }}>
            Custom Eidi hampers, packed with love 💖
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fadeUp" style={{ animationDelay: '240ms' }}>
            <Link to="/build" className="btn-primary text-base">
              Start Building <span className="ml-1 animate-bounceSoft inline-block">💖</span>
            </Link>
            <a href="#products" className="btn-outline text-base">Ready-Made Hampers</a>
          </div>

          {/* Floating icons around hero */}
          <FloatingEmoji emoji="🌸" className="top-8 left-[8%]" delay={0} />
          <FloatingEmoji emoji="💝" className="top-24 right-[10%]" delay={1.5} />
          <FloatingEmoji emoji="🎀" className="bottom-32 left-[12%]" delay={3} />
          <FloatingEmoji emoji="✨" className="bottom-40 right-[16%]" delay={2} />
        </div>
      </section>

      {/* MARQUEE TRUST BAR */}
      <div className="marquee-container overflow-hidden py-4 bg-wrap-blush/40 border-y border-wrap-rose/10">
        <div className="marquee-track text-wrap-rose/80 font-medium text-sm whitespace-nowrap">
          {[...TRUST, ...TRUST, ...TRUST].map((t, i) => (
            <span key={i} className="px-2">{t}</span>
          ))}
        </div>
      </div>

      {/* STEPS */}
      <section className="section">
        <Reveal>
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[0.25em] text-wrap-rose/80 mb-2">✦ How it works</div>
            <h2 className="font-display text-4xl md:text-5xl"><span className="text-gradient-static">Three</span> simple steps</h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="card p-8 text-center hover:shadow-pop hover:-translate-y-2 transition-all group">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-wrap-blush via-wrap-dusty/50 to-wrap-pink/20 flex items-center justify-center text-4xl shadow-soft group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">{s.icon}</div>
                <h3 className="font-display text-xl text-wrap-plum">{s.title}</h3>
                <p className="text-sm text-wrap-plum/70 mt-2">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section id="products" className="section">
        <Reveal>
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-wrap-rose/80 mb-2">✦ Curated</div>
              <h2 className="font-display text-4xl md:text-5xl"><span className="text-gradient">Featured</span> Goodies</h2>
              <p className="text-wrap-plum/70 mt-2">Hand-picked items to delight.</p>
            </div>
            <Link to="/build" className="btn-outline text-sm hidden md:inline-flex">Build Custom 💌</Link>
          </div>
        </Reveal>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 shimmer rounded" />
                  <div className="h-3 w-1/2 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* PACKAGING */}
      <section className="section">
        <Reveal>
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-[0.25em] text-wrap-rose/80 mb-2">✦ Wrap it up</div>
            <h2 className="font-display text-4xl md:text-5xl"><span className="text-gradient-static">Packaging</span> Options</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {packagingProducts.map((p, i) => {
            const meta = PACKAGING_LABELS[p.packaging_type] || { name: p.name, emoji: '📦' };
            return (
              <Reveal key={p.id} delay={i * 80}>
                <div className="card p-5 text-center hover:shadow-pop hover:-translate-y-1 transition-all group cursor-pointer">
                  <div className="text-5xl mb-2 inline-block group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">{meta.emoji}</div>
                  {p.images?.[0] && (
                    <div className="overflow-hidden rounded-2xl mb-3">
                      <img src={imgUrl(p.images[0])} className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="font-display text-lg">{meta.name}</div>
                  <div className="text-wrap-rose font-semibold text-sm mt-1">Rs.{p.price}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ADD-ONS */}
      {addons.length > 0 && (
        <section className="section">
          <Reveal>
            <div className="text-center mb-10">
              <div className="text-xs uppercase tracking-[0.25em] text-wrap-rose/80 mb-2">✦ Extra love</div>
              <h2 className="font-display text-4xl md:text-5xl"><span className="text-gradient">Cute</span> Add-ons</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {addons.map((p, i) => (
              <Reveal key={p.id} delay={i * 100}>
                <ProductCard product={p} compact />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* CTA STRIP */}
      <Reveal>
        <section className="section">
          <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center text-white shadow-pop"
               style={{ background: 'linear-gradient(135deg, #E8508E 0%, #9B6B9E 100%)' }}>
            <div className="blob bg-white w-[300px] h-[300px] -top-20 -right-20 opacity-20" />
            <div className="blob bg-white w-[260px] h-[260px] -bottom-24 -left-20 opacity-15" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl">Ready to make someone smile?</h2>
              <p className="mt-3 text-white/90 max-w-lg mx-auto">Pick items, choose packaging, write a note. We do the rest 💖</p>
              <Link to="/build" className="mt-6 inline-flex btn bg-white text-wrap-rose font-semibold hover:scale-105 transition-transform">
                Start Building Now ✨
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />
    </div>
  );
}

function Confetti() {
  const dots = Array.from({ length: 28 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((_, i) => {
        const colors = ['#E8508E', '#C73E6F', '#9B6B9E', '#D89CB0', '#A8366A', '#F5D9E2'];
        const left = (i * 73) % 100;
        const top = (i * 47) % 90;
        const delay = (i * 0.3) % 8;
        const size = 6 + (i % 5) * 5;
        const duration = 8 + (i % 5) * 2;
        return (
          <span
            key={i}
            className="confetti"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              background: colors[i % colors.length],
              width: `${size}px`,
              height: `${size}px`,
              animation: `floatSlow ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`
            }}
          />
        );
      })}
    </div>
  );
}

function SparkleField() {
  const sparkles = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map((_, i) => {
        const left = (i * 89) % 100;
        const top = (i * 53) % 90;
        const delay = (i * 0.4) % 3;
        return (
          <span
            key={i}
            className="sparkle"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animation: `sparkle 3s ease-in-out infinite`,
              animationDelay: `${delay}s`
            }}
          >✦</span>
        );
      })}
    </div>
  );
}

function FloatingEmoji({ emoji, className, delay = 0 }) {
  return (
    <span
      className={`absolute text-3xl md:text-4xl opacity-70 pointer-events-none animate-floatSlow hidden md:inline ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {emoji}
    </span>
  );
}
