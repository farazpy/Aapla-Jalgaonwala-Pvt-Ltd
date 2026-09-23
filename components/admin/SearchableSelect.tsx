'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Package, Tag } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  keywords?: string[];
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  type?: 'product' | 'category' | 'generic';
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Select an option --',
  searchPlaceholder = 'Search by name, category...',
  disabled = false,
  className = '',
  type = 'product'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSubtitle = opt.subtitle ? opt.subtitle.toLowerCase().includes(query) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(query) : false;
      const matchKeywords = opt.keywords ? opt.keywords.some(k => k.toLowerCase().includes(query)) : false;
      return matchLabel || matchSubtitle || matchBadge || matchKeywords;
    });
  }, [options, searchQuery]);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  };

  const scrollIndexIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-select-item]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full text-left ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Control Box */}
      <button
        type="button"
        id={`searchable-select-trigger-${type}`}
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-stone-50 hover:bg-stone-100/80 border ${
          isOpen ? 'border-[#9B111E] ring-2 ring-[#9B111E]/10 bg-white' : 'border-stone-200'
        } rounded-xl text-left transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {selectedOption.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedOption.image}
                  alt={selectedOption.label}
                  className="w-6 h-6 rounded-md object-cover border border-stone-200 flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-stone-200 text-stone-500 flex items-center justify-center flex-shrink-0">
                  {type === 'category' ? <Tag className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-900 truncate leading-snug">{selectedOption.label}</p>
                {selectedOption.subtitle && (
                  <p className="text-[10px] text-stone-500 font-medium truncate leading-none mt-0.5">{selectedOption.subtitle}</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-stone-400 text-xs font-medium">
              {type === 'category' ? <Tag className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
              <span className="truncate">{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <div className="p-0.5 text-stone-400">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#9B111E]' : ''}`} />
          </div>
        </div>
      </button>

      {/* Select2-Style Dropdown Popover */}
      {isOpen && (
        <div
          id={`searchable-select-dropdown-${type}`}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top flex flex-col"
          style={{ maxHeight: '320px' }}
        >
          {/* Sticky Search Header Box */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/80 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-8 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 font-medium focus:outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  className="absolute right-2 p-0.5 text-stone-400 hover:text-stone-700 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
              <span>{filteredOptions.length} available</span>
              {searchQuery && <span>Filtered by &quot;{searchQuery}&quot;</span>}
            </div>
          </div>

          {/* Scrollable Options List */}
          <div ref={listRef} className="overflow-y-auto divide-y divide-stone-50 flex-1 p-1" tabIndex={-1}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    data-select-item
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-100 ${
                      isSelected
                        ? 'bg-[#9B111E] text-white font-bold'
                        : isHighlighted
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={opt.image}
                          alt={opt.label}
                          className="w-7 h-7 rounded-lg object-cover border border-stone-200 flex-shrink-0 bg-white"
                        />
                      ) : (
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {type === 'category' ? <Tag className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-xs truncate leading-snug ${isSelected ? 'text-white font-bold' : 'font-semibold text-stone-900'}`}>
                            {opt.label}
                          </p>
                          {opt.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subtitle && (
                          <p className={`text-[10px] truncate leading-none mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-500'}`}>
                            {opt.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-white flex-shrink-0 stroke-[3]" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center">
                <Package className="w-7 h-7 text-stone-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-stone-700">No matching items found</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Try searching with a different keyword</p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-[11px] font-bold text-[#9B111E] hover:underline"
                  >
                    Clear search term
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
