export default function Footer() {
  const waNum = import.meta.env.VITE_WHATSAPP_NUMBER || '923001234567';
  return (
    <footer className="mt-20 bg-gradient-to-br from-wrap-blush via-wrap-cream to-wrap-dusty/40 border-t border-wrap-rose/10">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="font-display text-3xl"><span className="text-gradient font-bold">Wrapify</span> ✨</div>
          <p className="text-sm text-wrap-plum/70 mt-2 italic">Cute. Custom. Made for your loved ones.</p>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-2">Quick Links</div>
          <ul className="space-y-1 text-wrap-plum/70">
            <li><a href="/" className="hover:text-wrap-pink">Home</a></li>
            <li><a href="/build" className="hover:text-wrap-pink">Build Hamper</a></li>
            <li><a href="/#products" className="hover:text-wrap-pink">Ready Hampers</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-2">Order on WhatsApp</div>
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 btn-primary"
          >
            💬 Message Us
          </a>
        </div>
      </div>
      <div className="text-center text-xs text-wrap-plum/50 pb-6">© {new Date().getFullYear()} Wrapify. Made with 💖</div>
    </footer>
  );
}
