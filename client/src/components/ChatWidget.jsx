import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'wrapify_chat_v1';
const GREETING = "Hi! I'm Wrapify Assistant 💖 Tell me your budget and who it's for — I'll suggest a cute hamper for you ✨";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ role: 'assistant', content: GREETING }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open || ollamaStatus !== null) return;
    fetch('/api/chat/health').then(r => r.json()).then(setOllamaStatus).catch(() => setOllamaStatus({ ok: false }));
  }, [open, ollamaStatus]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter(m => m.role !== 'system') })
      });
      const data = await r.json();
      if (!r.ok) {
        setMessages(m => [...m, { role: 'assistant', content: `${data.error || 'Error'}.${data.hint ? `\n\n💡 ${data.hint}` : ''}` }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `Connection issue: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([{ role: 'assistant', content: GREETING }]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full text-white shadow-pop flex items-center justify-center text-2xl transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #E8508E 0%, #C73E6F 100%)' }}
        aria-label="Open chat"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100dvh-8rem)] bg-white rounded-3xl shadow-pop border border-wrap-rose/15 flex flex-col overflow-hidden animate-fadeUp">
          <div className="px-5 py-4 border-b border-wrap-rose/10 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #F5D9E2 0%, #FBF1F0 100%)' }}>
            <div>
              <div className="font-display text-lg text-wrap-plum">Wrapify Assistant ✨</div>
              <div className="text-xs text-wrap-plum/60">
                {ollamaStatus === null ? '...' : ollamaStatus.ok ? '🟢 Online' : '🟡 Setup needed'}
              </div>
            </div>
            <button onClick={reset} className="text-xs text-wrap-rose hover:underline">Reset</button>
          </div>

          {ollamaStatus && !ollamaStatus.ok && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
              <div className="font-semibold mb-1">⚠️ Ollama not running</div>
              <div>Install: <code className="bg-white px-1 rounded">brew install ollama</code></div>
              <div>Pull model: <code className="bg-white px-1 rounded">ollama pull llama3.2:3b</code></div>
              <div>Then: <code className="bg-white px-1 rounded">ollama serve</code></div>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-wrap-blush/60 text-wrap-plum rounded-bl-md'
                  }`}
                  style={m.role === 'user' ? { background: 'linear-gradient(135deg, #E8508E 0%, #C73E6F 100%)' } : {}}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-wrap-blush/60 text-wrap-plum px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-wrap-rose rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-wrap-rose rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="w-1.5 h-1.5 bg-wrap-rose rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-wrap-rose/10 bg-white flex-shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Type your budget or question…"
                disabled={loading}
                className="flex-1 min-w-0 px-4 py-2 rounded-pill border border-wrap-rose/30 text-sm focus:outline-none focus:border-wrap-rose bg-wrap-cream"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-40 flex-shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
