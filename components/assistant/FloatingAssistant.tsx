'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  MessageSquareText, 
  Store, 
  Package, 
  Truck, 
  Briefcase, 
  Flame,
  Copy,
  Check,
  PhoneCall,
  Utensils,
  HeartHandshake
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: '🍌 10 Banana Chip Flavours', query: 'What are the 10 flavours of Banana Chips available and what are their prices?' },
  { label: '🍲 Shev Bhaji Recipe', query: 'Give me the authentic step-by-step recipe for Jalgaon Shev Bhaji using Tikhat Shev and Kala Masala.' },
  { label: '🌶️ Khandeshi Kala Masala', query: 'Tell me about the authentic 24-spice Khandeshi Kala Masala and what makes it special.' },
  { label: '🕉️ Upwas Fasting Snacks', query: 'Which snacks are 100% Sendha Namak compliant and safe for Shravan/Navratri Upwas?' },
  { label: '🚚 Free Delivery Info', query: 'What are your delivery charges and how do I qualify for Free Shipping?' },
  { label: '📦 Track My Order', query: 'How can I track my placed order and what is the delivery timeline?' },
  { label: '👩‍💼 15% Partner Program', query: 'How does the Women Business Partner Program work and how do I earn 15% commission?' },
  { label: '🏢 Franchise Details', query: 'What are the investment, margins, and support provided for opening an Aapla Jalgaonwala store franchise?' },
  { label: '🎁 Gift Hampers', query: 'What festive combos and gift hampers are available for family and corporate gifting?' },
  { label: '📞 Contact & WhatsApp Help', query: 'What is your store address, WhatsApp helpline number, and customer support guarantee?' },
];

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasPromptBubble, setHasPromptBubble] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messageCounterRef = useRef(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-init',
      role: 'assistant',
      text: 'Namaskar! 🙏 Welcome to **Aapla Jalgaonwala**.\n\nI am **Snack Mitra** (स्नॅक मित्र), your personal Jalgaon snack concierge and brand ambassador. How can I help you today?\n\nAsk me anything about:\n• **10 Signature Banana Chip Flavours** (₹79)\n• **Authentic Shev Bhaji Recipe & Masalas**\n• **Upwas / Fasting Snacks** (100% Sendha Namak)\n• **Delivery & Free Shipping Thresholds**\n• **15% Partner Commission & Franchise Opportunities**\n• **Order Support & 100% Freshness Guarantee**',
      timestamp: 'Just now'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, isMinimized]);

  // Hide initial greeting teaser bubble after 12 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasPromptBubble(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    messageCounterRef.current += 1;
    const currentMsgCount = messageCounterRef.current;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: Message = {
      id: `usr-${currentMsgCount}`,
      role: 'user',
      text: text,
      timestamp: currentTime
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);
    setHasPromptBubble(false);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userQuery: text
        })
      });

      const data = await res.json();
      messageCounterRef.current += 1;
      const assistantMessage: Message = {
        id: `ast-${messageCounterRef.current}`,
        role: 'assistant',
        text: data.reply || "Thank you for asking! Please check out our [Shop](/shop) for fresh Jalgaon snacks.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
      messageCounterRef.current += 1;
      setMessages(prev => [
        ...prev,
        {
          id: `err-${messageCounterRef.current}`,
          role: 'assistant',
          text: "Namaskar! I'm temporarily unable to reach the server. You can explore all our signature snacks in our [Shop](/shop) or connect directly on WhatsApp (+91 98230 12345) on our [Contact](/contact) page.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    messageCounterRef.current += 1;
    setMessages([
      {
        id: `welcome-reset-${messageCounterRef.current}`,
        role: 'assistant',
        text: 'Namaskar! 🙏 Conversation reset. I am **Snack Mitra**! How can I assist you with Aapla Jalgaonwala snacks, recipes, shipping, or franchise opportunities today?',
        timestamp: 'Just now'
      }
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format text and render markdown-style links into interactive Links
  const renderFormattedText = (rawText: string) => {
    // Regex matches markdown links: [Title](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(rawText.substring(lastIndex, match.index));
      }
      const title = match[1];
      const href = match[2];
      parts.push(
        <Link
          key={`link-${match.index}`}
          href={href}
          onClick={() => {
            if (window.innerWidth < 768) {
              setIsOpen(false);
            }
          }}
          className="inline-flex items-center gap-1 font-bold text-[#9B111E] underline decoration-rose-300 underline-offset-2 hover:text-rose-800 transition-colors bg-rose-50/90 px-1.5 py-0.5 rounded shadow-2xs"
        >
          {title}
        </Link>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
      parts.push(rawText.substring(lastIndex));
    }

    return parts.map((part, idx) => {
      if (typeof part !== 'string') return part;

      // Format bold text **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return (
            <strong key={`b-${idx}-${bIdx}`} className="font-bold text-stone-900">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  return (
    <div id="floating-ai-assistant-container" className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end font-sans">
      
      {/* Initial Teaser Prompt Bubble */}
      {!isOpen && hasPromptBubble && (
        <div 
          id="assistant-teaser-bubble"
          className="mb-3 max-w-[280px] bg-white border border-stone-200 shadow-xl rounded-2xl p-3.5 text-xs text-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-300 relative group cursor-pointer"
          onClick={() => {
            setIsOpen(true);
            setHasPromptBubble(false);
          }}
        >
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHasPromptBubble(false);
            }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center text-stone-500 text-[10px] shadow-xs cursor-pointer"
            aria-label="Dismiss message"
          >
            ✕
          </button>
          <div className="flex items-center gap-1.5 font-bold text-[#9B111E] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Need help with snacks & orders?</span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed">
            Ask Snack Mitra about our 10 Banana Chip flavours, authentic Shev Bhaji recipe, or track orders!
          </p>
        </div>
      )}

      {/* Main Chat Widget Modal */}
      {isOpen && (
        <div 
          id="ai-assistant-chat-panel"
          className={`bg-white border border-stone-200/90 shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized 
              ? 'h-16 w-80 mb-3' 
              : 'w-[92vw] sm:w-[400px] md:w-[440px] h-[600px] max-h-[86vh] mb-3'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9B111E] via-[#850e19] to-[#6d0912] text-white p-3.5 px-4 flex items-center justify-between shadow-xs select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#9B111E] rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white tracking-tight">
                    Snack Mitra
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400/25 text-amber-200 border border-amber-400/40 flex items-center gap-1 tracking-wide">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>AI Concierge</span>
                  </span>
                </div>
                <p className="text-[10px] text-white/80 font-medium">
                  {isMinimized ? 'Minimized • Click to expand' : 'Online • Instant Snack & Store Guide'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset conversation"
                className="w-7 h-7 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                className="w-7 h-7 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                title="Close chat"
                className="w-7 h-7 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Prompt Badges */}
              <div className="bg-stone-50 border-b border-stone-200/80 px-3 py-2 overflow-x-auto flex gap-1.5 scrollbar-none no-scrollbar">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(qp.query)}
                    disabled={isLoading}
                    className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-amber-50 hover:border-amber-200 hover:text-[#9B111E] text-stone-700 border border-stone-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-stone-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="w-7 h-7 rounded-xl bg-[#9B111E]/10 border border-[#9B111E]/20 flex items-center justify-center text-[#9B111E] shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-stone-900 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                        U
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed relative group ${
                        msg.role === 'user'
                          ? 'bg-[#9B111E] text-white rounded-tr-xs font-medium'
                          : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs whitespace-pre-line'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="space-y-1.5">
                          {renderFormattedText(msg.text)}
                        </div>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                      
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-stone-100/60 text-[9px]">
                        {msg.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="text-stone-400 hover:text-stone-700 flex items-center gap-1 font-medium cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                        <div
                          className={`ml-auto ${
                            msg.role === 'user' ? 'text-rose-200/70' : 'text-stone-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#9B111E]/10 border border-[#9B111E]/20 flex items-center justify-center text-[#9B111E] shrink-0">
                      <Sparkles className="w-4 h-4 animate-spin text-[#9B111E]" />
                    </div>
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#9B111E] animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 rounded-full bg-[#9B111E] animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 rounded-full bg-[#9B111E] animate-bounce"></div>
                        <span className="text-[10px] text-stone-400 font-medium ml-1">Snack Mitra is replying...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Quick Links Navigation Bar */}
              <div className="px-3 py-2 bg-white border-t border-stone-100 flex items-center justify-between text-[10.5px] text-stone-600 font-semibold">
                <Link href="/shop" className="hover:text-[#9B111E] flex items-center gap-1 transition-colors">
                  <Store className="w-3.5 h-3.5 text-[#9B111E]" />
                  <span>Shop</span>
                </Link>
                <span className="text-stone-300">•</span>
                <Link href="/categories" className="hover:text-[#9B111E] flex items-center gap-1 transition-colors">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>Categories</span>
                </Link>
                <span className="text-stone-300">•</span>
                <Link href="/partner-program" className="hover:text-[#9B111E] flex items-center gap-1 transition-colors">
                  <HeartHandshake className="w-3.5 h-3.5 text-pink-600" />
                  <span>Partner 15%</span>
                </Link>
                <span className="text-stone-300">•</span>
                <Link href="/franchise" className="hover:text-[#9B111E] flex items-center gap-1 transition-colors">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Franchise</span>
                </Link>
                <span className="text-stone-300">•</span>
                <Link href="/contact" className="hover:text-[#9B111E] flex items-center gap-1 transition-colors">
                  <MessageSquareText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Support</span>
                </Link>
              </div>

              {/* Input Footer Area */}
              <div className="p-3 bg-stone-50 border-t border-stone-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="Ask recipes, 10 flavours, free shipping, franchise..."
                      disabled={isLoading}
                      className="w-full pl-3.5 pr-8 py-2.5 text-xs bg-white border border-stone-200 rounded-2xl focus:outline-hidden focus:border-[#9B111E] focus:ring-2 focus:ring-[#9B111E]/10 placeholder:text-stone-400 shadow-inner font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isLoading}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                      inputQuery.trim() && !isLoading
                        ? 'bg-[#9B111E] hover:bg-[#850e19] text-white shadow-md'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        id="open-ai-assistant-btn"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
          setHasPromptBubble(false);
        }}
        aria-label="Open Snack Mitra AI"
        className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-full shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-stone-900 hover:bg-stone-800 text-white border border-stone-700'
            : 'bg-[#9B111E] hover:bg-[#800A14] text-white border-2 border-amber-300/80 shadow-rose-950/20 hover:shadow-2xl hover:scale-105'
        }`}
      >
        <div className="relative flex items-center justify-center shrink-0">
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center border border-amber-200/40 backdrop-blur-xs">
              <Bot className="w-4 h-4 text-amber-300" />
            </div>
          )}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#9B111E] shadow-xs"></span>
          )}
        </div>

        <div className="flex flex-col items-start pr-1 select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wide text-white leading-none">
              {isOpen ? 'Close AI' : 'Snack Mitra'}
            </span>
            {!isOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </div>
          {!isOpen && (
            <span className="text-[10px] font-extrabold text-amber-300 tracking-wider uppercase mt-0.5">
              AI Guide
            </span>
          )}
        </div>
      </button>

    </div>
  );
}
