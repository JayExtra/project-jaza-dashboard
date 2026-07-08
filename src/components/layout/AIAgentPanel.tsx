import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, Loader2, ArrowRight } from 'lucide-react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

interface AIAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAgentPanel = ({ isOpen, onClose }: AIAgentPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I'm your Jaza AI Assistant. I'm connected to your collective workspace ledger. Ask me to compile smart reports, audit member campaigns, or explain any architectural growth metrics.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let replyText = "I've received your query. Let me look that up in the ledger index for you...";
      const normalizedText = textToSend.toLowerCase();

      if (normalizedText.includes('report')) {
        replyText = "Generating your Jaza Smart Report. Based on current transactions, collective pool growth is up 14.2% this quarter with zero discrepancies. Let me know if you want to export this as an audit PDF.";
      } else if (normalizedText.includes('audit') || normalizedText.includes('campaign')) {
        replyText = "Auditing campaigns. Active campaign metrics are stable. Total estimated earnings stand at $0.00 across pending influencers, with a total network reach of 0. I will notify you once new conversion feeds load.";
      } else if (normalizedText.includes('payout') || normalizedText.includes('distribution')) {
        replyText = "Smart distributions are set to automatic. Based on your current organisation rules, payouts trigger when thresholds exceed $500. You can adjust this in Settings > General.";
      } else if (normalizedText.includes('hello') || normalizedText.includes('hi')) {
        replyText = "Hello! How can I assist you with your group wealth, payments, or campaigns today?";
      } else {
        replyText = `I have parsed your request: "${textToSend}". I am analyzing collective trends and will prepare a tailored suggestion for your Jaza group funds.`;
      }

      const assistantMsg: Message = {
        sender: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const suggestions = [
    'Generate Smart Report',
    'Audit Campaign Earnings',
    'Explain Auto-Payout rules',
  ];

  return (
    <>
      {/* Semi-transparent Backdrop Overlay with blur */}
      <div
        className={`fixed inset-0 bg-black/15 backdrop-blur-[4px] z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Panel container */}
      <div
        className={`fixed top-0 right-0 h-full w-[440px] max-w-full bg-surface-lowest shadow-[0_16px_48px_rgba(0,0,0,0.18)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface-low/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles size={20} className="text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-primary text-base">Jaza AI Assistant</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Online Ledger Agent</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground/40 hover:text-foreground hover:bg-surface-low rounded-lg transition-all"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-none'
                      : 'bg-surface-low text-foreground rounded-tl-none border border-border/40'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] font-bold text-foreground/30 uppercase mt-1 tracking-wider px-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="bg-surface-low border border-border/40 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-xs text-foreground/50">Analyzing ledger...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && !isTyping && (
          <div className="px-6 py-2 flex flex-wrap gap-2 animate-in fade-in duration-500">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                className="text-xs font-medium bg-surface-low hover:bg-surface-low-hover text-foreground/70 px-3 py-2 rounded-xl border border-border/40 hover:border-primary/30 transition-all flex items-center gap-1.5"
              >
                {sug}
                <ArrowRight size={12} className="opacity-40" />
              </button>
            ))}
          </div>
        )}

        {/* Input Footer */}
        <div className="p-6 border-t border-border bg-surface-low/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your collective ledger..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-surface-container-highest border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-11 h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-[10px] text-foreground/30 text-center font-bold tracking-wider uppercase mt-3">
            Jaza AI • Enterprise Grade Cryptographic Auditing
          </p>
        </div>
      </div>
    </>
  );
};
