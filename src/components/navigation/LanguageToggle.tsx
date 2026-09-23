import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LanguageToggleProps {
  variant?: 'navbar' | 'dropdown' | 'compact' | 'pill' | 'mobile';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'dropdown', className = '' }) => {
  const { language, setLanguage, isMarathi } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
            isMarathi
              ? 'bg-amber-400 text-stone-900 border-amber-300 shadow-xs'
              : 'bg-white/15 text-white hover:bg-white/25 border-white/20'
          }`}
          title="Switch Language / भाषा निवडा"
          aria-label="Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="whitespace-nowrap">{isMarathi ? 'मराठी' : 'English'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-stone-200 p-1.5 z-50 text-xs"
            >
              <button
                type="button"
                onClick={() => { setLanguage('en'); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  language === 'en' ? 'bg-[#9B111E]/10 text-[#9B111E]' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>🇬🇧 English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-[#9B111E]" />}
              </button>
              <button
                type="button"
                onClick={() => { setLanguage('mr'); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  language === 'mr' ? 'bg-[#9B111E]/10 text-[#9B111E]' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>🇮🇳 मराठी</span>
                {language === 'mr' && <Check className="w-3.5 h-3.5 text-[#9B111E]" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80 text-xs ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
            language === 'en'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('mr')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
            language === 'mr'
              ? 'bg-[#9B111E] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>मराठी</span>
        </button>
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={`bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-xs font-bold text-stone-700">
          <span className="flex items-center gap-1.5 whitespace-nowrap truncate">
            <Languages className="w-4 h-4 text-[#9B111E] shrink-0" />
            <span className="truncate">Select Language</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#9B111E] bg-[#9B111E]/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            {isMarathi ? 'मराठी सक्रिय' : 'English Active'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap ${
              language === 'en'
                ? 'bg-white text-stone-900 border-[#9B111E] shadow-sm ring-1 ring-[#9B111E]'
                : 'bg-white/60 text-stone-600 border-stone-200 hover:bg-white'
            }`}
          >
            <span className="whitespace-nowrap">🇬🇧 English</span>
            {language === 'en' && <Check className="w-3.5 h-3.5 text-[#9B111E] shrink-0" />}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('mr')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap ${
              language === 'mr'
                ? 'bg-[#9B111E] text-white border-[#9B111E] shadow-sm'
                : 'bg-white/60 text-stone-600 border-stone-200 hover:bg-white'
            }`}
          >
            <span className="whitespace-nowrap">🇮🇳 मराठी</span>
            {language === 'mr' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
          </button>
        </div>
      </div>
    );
  }

  // Default Dropdown Variant (Desktop & Navbar)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center p-2 sm:p-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border shrink-0 shadow-2xs ${
          isOpen || isMarathi
            ? 'bg-amber-50 text-[#9B111E] border-amber-300 hover:bg-amber-100/80'
            : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/90'
        }`}
        title="Change Language / भाषा बदला"
        aria-label="Language Selector Dropdown"
        aria-expanded={isOpen}
      >
        <Languages className="w-4 h-4 sm:w-5 sm:h-5 text-[#9B111E] shrink-0" />
      </button>

      {/* Language Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-stone-200/90 p-1.5 z-[100] overflow-hidden"
          >
            <div className="px-2.5 py-1.5 border-b border-stone-100 mb-1">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider whitespace-nowrap">
                Select Language
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                language === 'en'
                  ? 'bg-[#9B111E] text-white shadow-xs font-black'
                  : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>🇬🇧</span>
                <span className="whitespace-nowrap">English</span>
              </div>
              {language === 'en' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage('mr');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap mt-0.5 ${
                language === 'mr'
                  ? 'bg-[#9B111E] text-white shadow-xs font-black'
                  : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>🇮🇳</span>
                <span className="whitespace-nowrap">मराठी (Marathi)</span>
              </div>
              {language === 'mr' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

