import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const dotRef = useRef(null);
  const lastTrail = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = (navigator.maxTouchPoints || 0) > 0 || window.matchMedia('(hover: none)').matches;
    if (isTouch) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.add('cursor-on');

    const onMove = (e) => {
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }

      const now = performance.now();
      if (now - lastTrail.current < 35) return;
      lastTrail.current = now;

      const trail = document.createElement('span');
      trail.className = 'wrap-cursor-trail';
      trail.style.left = `${e.clientX}px`;
      trail.style.top = `${e.clientY}px`;
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 600);
    };

    const setHover = (on) => {
      if (dotRef.current) dotRef.current.classList.toggle('hovering', on);
    };

    const onOver = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest('a, button, input, textarea, select, [role="button"], .card')) {
        setHover(true);
      }
    };
    const onOut = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest('a, button, input, textarea, select, [role="button"], .card')) {
        setHover(false);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);

    return () => {
      document.documentElement.classList.remove('cursor-on');
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
    };
  }, []);

  return <div ref={dotRef} className="wrap-cursor-dot" aria-hidden="true" />;
}
