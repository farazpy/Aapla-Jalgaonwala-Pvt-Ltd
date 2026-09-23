import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  MessageCircle,
  Send,
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const BOT_ICON_URL = 'https://res.cloudinary.com/uuid1vym/image/upload/v1789424200/snack_mitra_fxqqc8.png';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ExtractedLink {
  label: string;
  url: string;
}

interface PublicBotConfig {
  enabled: boolean;
  botName: string;
  botTagline: string;
  welcomeMessage?: string;
  quickSuggestions: Array<{ label: string; query: string }>;
  whatsappNumber: string;
}

const STORAGE_KEY = 'ajw_chat_messages_v1';

const DEFAULT_SUGGESTIONS = [
  { label: '🍌 Top Banana Chips', query: 'What are your top bestselling banana chips flavours and prices?' },
  { label: '📖 Our Story & Founders', query: 'Tell me about Aapla Jalgaonwala founders and our story.' },
  { label: '📍 Store & Contact Info', query: 'Where is your flagship store located and how do I contact you?' },
  { label: '📦 Track My Order', query: 'How do I track my order status live?' },
  { label: '🍲 Shev Bhaji Recipe', query: 'Can you give me the authentic Jalgaon Shev Bhaji recipe with Tikhat Shev?' },
  { label: '🚚 Free Shipping Rules', query: 'What are your delivery charges and free shipping thresholds?' },
  { label: '🏷️ Active Coupons', query: 'What active discount coupon codes can I use today?' },
  { label: '💼 Women Partner Program', query: 'Tell me about the 12% Women Business Partner program and how to earn.' },
  { label: '🙏 Fasting / Upwas Snacks', query: 'Which snacks are safe for Upwas/Fasting with Sendha Namak?' }
];

export function FloatingAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkSuggestionsScroll = () => {
    if (suggestionsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = suggestionsRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  const scrollSuggestions = (direction: 'left' | 'right') => {
    if (suggestionsRef.current) {
      const offset = direction === 'left' ? -180 : 180;
      suggestionsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkSuggestionsScroll, 220);
    }
  };

  const handleSuggestionsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (suggestionsRef.current && e.deltaY !== 0) {
      suggestionsRef.current.scrollLeft += e.deltaY;
      checkSuggestionsScroll();
    }
  };

  // Live public bot configuration fetched from server
  const [botConfig, setBotConfig] = useState<PublicBotConfig>({
    enabled: true,
    botName: 'Snack Mitra',
    botTagline: 'Aapla Jalgaonwala Support',
    quickSuggestions: DEFAULT_SUGGESTIONS,
    whatsappNumber: '+91 70574 46409'
  });

  useEffect(() => {
    fetch('/api/snack-mitra/public-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setBotConfig({
            enabled: data.enabled !== false,
            botName: data.botName || 'Snack Mitra',
            botTagline: data.botTagline || 'Aapla Jalgaonwala Support',
            welcomeMessage: data.welcomeMessage,
            quickSuggestions: Array.isArray(data.quickSuggestions) && data.quickSuggestions.length > 0
              ? data.quickSuggestions
              : DEFAULT_SUGGESTIONS,
            whatsappNumber: data.whatsappNumber || '+91 70574 46409'
          });
        }
      })
      .catch(err => {
        console.warn('Failed fetching bot public config:', err);
      });
  }, []);

  // Initialize messages from sessionStorage or default welcome
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        text: `Namaskar! 🙏 Welcome to **Aapla Jalgaonwala**!

I am **Snack Mitra**, your personal customer support sahayak.

How can I help you today?
- 🍌 Discover our [10 Banana Chips Flavours](/shop?category=banana-chips)
- 📖 Learn about our heritage & founders in [Our Story](/our-story)
- 📍 Store address & details on our [Contact Page](/contact)
- 📦 Live order tracking (share your Order ID or phone number)
- 🍲 Authentic [Khandeshi Shev Bhaji](/shop?category=masala) recipes
- 🚚 Free Shipping thresholds (Above ₹399 in Maharashtra)

Feel free to ask in **English, Marathi (मराठी), or Hindi (हिंदी)**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // If live welcome message differs and user hasn't started custom conversation, update it
  useEffect(() => {
    if (botConfig.welcomeMessage && messages.length === 1 && messages[0].id === 'welcome-1') {
      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          text: botConfig.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [botConfig.welcomeMessage]);

  // Save to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setShowTooltip(false);
    }
  }, [isOpen]);

  // Dismiss tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 9000);
    return () => clearTimeout(timer);
  }, []);

  // Update suggestions scroll indicator when chat modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(checkSuggestionsScroll, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, botConfig.quickSuggestions]);

  const handleSend = async (customQuery?: string) => {
    const textToSend = (customQuery || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Format history for server
      const payloadMessages = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: m.text
      }));

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          userQuery: textToSend
        })
      });

      const data = await res.json();
      const isFirstTurn = newMessages.filter(m => m.role === 'user').length <= 1;
      let replyText = data.reply || (isFirstTurn
        ? "Namaskar! 🙏 How can I assist you with Aapla Jalgaonwala's fresh snacks today?"
        : "How can I assist you with Aapla Jalgaonwala's fresh snacks today?");

      if (!isFirstTurn && replyText) {
        const cleaned = replyText.replace(/^(?:(?:Namaskar|Namaste|नमस्कार|नमस्ते)[!,\s]*(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s)*)/u, '').trim();
        if (cleaned) {
          replyText = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
      }

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Support chat error:', err);
      const isFirstTurn = newMessages.filter(m => m.role === 'user').length <= 1;
      const fallbackText = isFirstTurn
        ? `Namaskar! 🙏 We are always here to assist you! Explore our fresh snacks in the [Shop](/shop), check your shipments under [My Account](/account), or chat directly with our helpline at [+91 70574 46409](https://wa.me/917057446409)!`
        : `We are always here to assist you! Explore our fresh snacks in the [Shop](/shop), check your shipments under [My Account](/account), or chat directly with our helpline at [+91 70574 46409](https://wa.me/917057446409)!`;
      const fallbackMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const initialMessage: ChatMessage = {
      id: 'welcome-reset',
      role: 'assistant',
      text: `Namaskar! 🙏 Chat cleared. I am **Snack Mitra**, ready to assist you with fresh snack recommendations, live order tracking, recipes, store info, or offers!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initialMessage]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleCopy = (id: string, text: string) => {
    // Strip markdown formatting when copying plain text
    const cleanText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*/g, '').replace(/`/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNavigate = (url: string) => {
    if (url.startsWith('http') || url.startsWith('https') || url.startsWith('wa.me')) {
      const targetUrl = url.startsWith('wa.me') ? `https://${url}` : url;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(url);
      if (window.innerWidth < 640) {
        setIsOpen(false);
      }
    }
  };

  /**
   * Helper to extract links from markdown for quick action buttons
   */
  const extractLinks = (text: string): ExtractedLink[] => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: ExtractedLink[] = [];
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      links.push({
        label: match[1],
        url: match[2]
      });
    }
    return links;
  };

  /**
   * Renders structured paragraphs, bold text, code pills, and inline links
   */
  const renderFormattedText = (rawText: string) => {
    // Split text into paragraphs or bullet lines
    const lines = rawText.split('\n');

    return (
      <div className="space-y-2">
        {lines.map((line, lineIdx) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return null;

          // Check if bullet point
          const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine);
          const cleanLine = isBullet ? trimmedLine.replace(/^[-*]\s+|\d+\.\s+/, '') : trimmedLine;

          const content = parseInlineTokens(cleanLine, `line-${lineIdx}`);

          if (isBullet) {
            return (
              <div key={`line-${lineIdx}`} className="flex items-start gap-2 pl-1 text-[13px] leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9B111E] mt-2 flex-shrink-0" />
                <div className="flex-1">{content}</div>
              </div>
            );
          }

          return (
            <p key={`line-${lineIdx}`} className="text-[13px] leading-relaxed text-stone-800">
              {content}
            </p>
          );
        })}
      </div>
    );
  };

  /**
   * Parses markdown links, bold text, and inline code tags
   */
  const parseInlineTokens = (text: string, keyPrefix: string): React.ReactNode => {
    // Match [Label](url) OR **bold** OR `code`
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      // 1. Markdown Link: [Label](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];
        const isInternal = url.startsWith('/') || url.startsWith('#');

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleNavigate(url)}
            className="inline-flex items-center gap-0.5 text-[#9B111E] font-semibold underline underline-offset-2 hover:text-[#7B0D17] transition-colors cursor-pointer px-0.5"
          >
            <span>{label}</span>
            {!isInternal && <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />}
          </button>
        );
      }

      // 2. Bold: **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-semibold text-stone-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // 3. Code: `text`
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={key} className="px-1.5 py-0.5 rounded bg-amber-100/70 text-[#9B111E] text-xs font-mono font-semibold border border-amber-200/80 mx-0.5">
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={key}>{part}</span>;
    });
  };

  // If assistant is disabled via admin panel, do not render on storefront
  if (botConfig.enabled === false) {
    return null;
  }

  return (
    <div id="floating-support-assistant-root">
      {/* Floating Launcher Button & Greeting Popover */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto select-none">
        {/* First-load Greeting Tooltip */}
        <AnimatePresence>
          {!isOpen && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative bg-stone-900 text-white p-3.5 rounded-2xl shadow-xl border border-stone-700/80 max-w-[260px] text-xs leading-snug cursor-pointer group"
              onClick={() => setIsOpen(true)}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-400/50 flex-shrink-0 bg-[#9B111E] shadow-xs">
                  <img
                    src={BOT_ICON_URL}
                    alt="Snack Mitra"
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="font-semibold text-amber-300">Namaskar! Need help?</p>
                  <p className="text-stone-300 text-[11px] mt-0.5">
                    Ask about snack flavours, live order tracking, recipes, or offers!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(false);
                  }}
                  className="text-stone-400 hover:text-white p-0.5 -mr-1 -mt-1 rounded cursor-pointer"
                  aria-label="Close message"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Tooltip caret */}
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-stone-900 border-r border-b border-stone-700/80 transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button - Rounded Square with Bot Icon */}
        <motion.button
          id="btn-open-snack-mitra"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(prev => !prev)}
          className={`relative group flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-400/40 cursor-pointer ${
            isOpen
              ? 'w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-stone-900 border border-stone-700 text-white shadow-xl'
              : 'w-14 h-14 sm:w-15 sm:h-15 p-1 rounded-2xl bg-gradient-to-tr from-[#7B0D17] via-[#9B111E] to-[#D9531E] border-2 border-amber-300 shadow-2xl shadow-red-950/40'
          }`}
          aria-label={isOpen ? 'Close Support Assistant' : 'Open Support Assistant'}
        >
          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-[#9B111E] flex items-center justify-center">
              <img
                src={BOT_ICON_URL}
                alt="Snack Mitra"
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
              {/* Online Pulse Dot */}
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
              </span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="modal-snack-mitra-chat"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-[410px] sm:max-w-[calc(100vw-32px)] h-[86vh] sm:h-[610px] max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden text-stone-800"
          >
            {/* Top Brand Header */}
            <div className="bg-gradient-to-r from-[#7B0D17] via-[#9B111E] to-[#800F1B] text-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between border-b border-red-900/30 flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-2xl bg-white/10 border-2 border-amber-300/60 overflow-hidden flex items-center justify-center shadow-inner flex-shrink-0">
                  <img
                    src={BOT_ICON_URL}
                    alt={botConfig.botName || 'Snack Mitra'}
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#9B111E] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base leading-tight tracking-tight">{botConfig.botName || 'Snack Mitra'}</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                  <p className="text-stone-300 text-xs mt-0.5">
                    {botConfig.botTagline || 'Aapla Jalgaonwala Support'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  aria-label="Clear chat history"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  aria-label="Close assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions Strip - Fully Scrollable with Wheel, Touch & Chevrons */}
            <div className="relative bg-[#FAF6ED] border-b border-stone-200/80 flex items-center flex-shrink-0 group/strip">
              {/* Left Scroll Chevron */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollSuggestions('left')}
                  className="absolute left-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-r from-[#FAF6ED] via-[#FAF6ED]/95 to-transparent text-stone-700 hover:text-[#9B111E] flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                  aria-label="Scroll suggestions left"
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-xs border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-[#9B111E]">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={suggestionsRef}
                onScroll={checkSuggestionsScroll}
                onWheel={handleSuggestionsWheel}
                className="w-full px-3 py-2.5 overflow-x-auto flex items-center gap-1.5 overscroll-x-contain touch-pan-x scroll-smooth no-scrollbar"
              >
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider pl-1 pr-1 flex items-center gap-1 flex-shrink-0 select-none">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Ask:
                </span>
                {(botConfig.quickSuggestions || DEFAULT_SUGGESTIONS).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSend(item.query)}
                    className="text-xs bg-white text-stone-700 hover:text-[#9B111E] hover:border-[#9B111E]/40 px-3 py-1.5 rounded-full border border-stone-200/90 shadow-2xs transition-all whitespace-nowrap flex-shrink-0 hover:bg-red-50/60 disabled:opacity-50 cursor-pointer active:scale-95 font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Right Scroll Chevron */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollSuggestions('right')}
                  className="absolute right-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-l from-[#FAF6ED] via-[#FAF6ED]/95 to-transparent text-stone-700 hover:text-[#9B111E] flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                  aria-label="Scroll suggestions right"
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-xs border border-stone-200/90 flex items-center justify-center text-stone-700 hover:text-[#9B111E]">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              )}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/50 text-sm">
              {messages.map((msg) => {
                const isAst = msg.role === 'assistant';
                const extractedLinks = isAst ? extractLinks(msg.text) : [];

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAst ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[92%] sm:max-w-[88%]">
                      {isAst && (
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-300/40 bg-[#9B111E] flex-shrink-0 shadow-2xs mb-1">
                          <img
                            src={BOT_ICON_URL}
                            alt="Snack Mitra"
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div
                        className={`relative rounded-2xl px-4 py-3 shadow-2xs group ${
                          isAst
                            ? 'bg-white border border-stone-200/90 text-stone-800 rounded-bl-xs'
                            : 'bg-gradient-to-tr from-[#800F1B] to-[#9B111E] text-white rounded-br-xs'
                        }`}
                      >
                        {isAst ? (
                          <>
                            {renderFormattedText(msg.text)}

                            {/* Action Pills for Links */}
                            {extractedLinks.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap gap-1.5">
                                {extractedLinks.map((link, lIdx) => (
                                   <button
                                    key={`chip-${lIdx}`}
                                    type="button"
                                    onClick={() => handleNavigate(link.url)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FAF6ED] hover:bg-[#F2ECE1] text-[#9B111E] border border-amber-200/80 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <span>{link.label}</span>
                                    <ArrowRight className="w-3 h-3 text-amber-700" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="whitespace-pre-line leading-relaxed text-[13px]">{msg.text}</p>
                        )}

                        {/* Copy button on bot messages */}
                        {isAst && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md cursor-pointer"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-stone-400 px-2 mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-md overflow-hidden border border-amber-300/40 bg-[#9B111E] flex-shrink-0 shadow-2xs mt-1">
                    <img
                      src={BOT_ICON_URL}
                      alt="Snack Mitra"
                      className="w-full h-full object-cover rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="bg-white border border-stone-200/90 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs text-stone-500 text-xs flex items-center gap-2">
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B111E] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B111E] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B111E] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-stone-500 text-[12px] font-medium ml-1">
                      {botConfig.botName || 'Snack Mitra'} is typing...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Escalation & Input Area */}
            <div className="p-3 bg-white border-t border-stone-200/90 flex-shrink-0">
              {/* WhatsApp Quick Escalation link */}
              <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-stone-500">
                <span className="flex items-center gap-1 font-medium text-stone-600">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Instant Store Assistant</span>
                </span>
                <a
                  href={`https://wa.me/${(botConfig.whatsappNumber || '917057446409').replace(/[^0-9]/g, '')}?text=Namaskar!%20I%20need%20support%20regarding%20Aapla%20Jalgaonwala%20order/products.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask in English, Marathi, or Hindi..."
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-stone-100 hover:bg-stone-50 focus:bg-white text-stone-800 placeholder-stone-400 rounded-xl border border-stone-200 focus:border-[#9B111E] focus:ring-2 focus:ring-[#9B111E]/20 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-[#9B111E] hover:bg-[#7B0D17] disabled:bg-stone-300 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FloatingAssistant;
