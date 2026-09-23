'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { Languages, X, Sparkles, Check } from 'lucide-react';

const COOKIE_NAME = 'ajw_marathi_popup_dismissed';
const ONE_DAY_SECONDS = 86400; // 24 hours * 60 * 60

export const MarathiLanguageModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const setDismissCookie = () => {
    if (typeof document === 'undefined') return;
    try {
      document.cookie = `${COOKIE_NAME}=true; max-age=${ONE_DAY_SECONDS}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Could not set cookie', e);
    }
  };

  useEffect(() => {
    // Check if dismissed within 1 day via cookie
    const dismissed = getCookie(COOKIE_NAME);
    if (dismissed) {
      return;
    }

    // Trigger popup exactly 5 seconds after page load
    const timer = setTimeout(() => {
      const stillDismissed = getCookie(COOKIE_NAME);
      if (!stillDismissed) {
        setIsOpen(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleChooseMarathi = () => {
    setLanguage('mr');
    setDismissCookie();
    setIsOpen(false);
  };

  const handleChooseEnglish = () => {
    setLanguage('en');
    setDismissCookie();
    setIsOpen(false);
  };

  const handleClose = () => {
    setDismissCookie();
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-end justify-center sm:justify-end p-3 sm:p-6">
          {/* Backdrop on mobile for focus, transparent on desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-stone-950/25 backdrop-blur-[2px] pointer-events-auto sm:hidden"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative pointer-events-auto w-full max-w-sm sm:max-w-md bg-white rounded-2xl sm:rounded-3xl border-2 border-amber-300 shadow-2xl overflow-hidden p-4 sm:p-5"
          >
            {/* Background Decorative Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/40 via-red-100/30 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer z-10"
              title="Close (1 दिवस पुन्हा दाखवू नका)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content Body */}
            <div className="relative z-10 space-y-3">
              {/* Header Badge */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#9B111E] flex items-center justify-center shrink-0">
                  <Languages className="w-4.5 h-4.5 text-[#9B111E]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
                    नवीन अपडेट • New
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-sm sm:text-base font-black text-stone-900 leading-tight">
                  Choose Language / भाषा निवडा
                </h4>
                <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-relaxed">
                  Default language is <strong>English</strong>. You can switch to Marathi or continue shopping in English.
                </p>
                <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 leading-relaxed font-medium">
                  मराठीत खरेदी करण्यासाठी खालील 'मराठीत पहा' बटनावर क्लिक करा.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Continue in English Button (Default) */}
                <button
                  type="button"
                  onClick={handleChooseEnglish}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    language === 'en'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>Continue in English</span>
                  {language === 'en' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                {/* Switch to Marathi Button */}
                <button
                  type="button"
                  onClick={handleChooseMarathi}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    language === 'mr'
                      ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400 font-extrabold'
                      : 'bg-[#9B111E] hover:bg-[#800A14] text-white active:scale-98'
                  }`}
                >
                  <span>मराठीत पहा</span>
                  {language === 'mr' ? <Check className="w-3.5 h-3.5" /> : <span>🇮🇳</span>}
                </button>
              </div>

              {/* Footer Note */}
              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                <span>Default: English • You can change language anytime</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="underline hover:text-stone-600 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
