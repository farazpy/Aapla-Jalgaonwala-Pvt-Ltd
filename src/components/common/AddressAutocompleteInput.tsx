import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Sparkles, Loader2 } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export interface AddressSelectData {
  addressLine1: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (data: AddressSelectData) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

export function AddressAutocompleteInput({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing house/building, society, street or area...',
  className = 'w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-[#9B111E]',
  required = false
}: AddressAutocompleteInputProps) {
  const { settings } = useSettings();
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedInputRef = useRef<string>('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions using Google Places API (via backend proxy or direct with Google Places Key)
  const fetchPlacesSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (lastFetchedInputRef.current === trimmed) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. First attempt: Use the server-side proxy which reads googleMapsApiKey from /admin/configs
      const res = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed })
      });

      let items: SuggestionItem[] = [];

      if (res.ok) {
        const json = await res.json();
        const rawSuggestions = json.data?.suggestions || json.suggestions || [];
        items = rawSuggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => {
            const pred = s.placePrediction;
            const mainText = pred.structuredFormat?.mainText?.text || pred.text?.text?.split(',')[0] || '';
            const secondaryText = pred.structuredFormat?.secondaryText?.text || '';
            const fullText = pred.text?.text || `${mainText}${secondaryText ? ', ' + secondaryText : ''}`;
            return {
              placeId: pred.placeId,
              mainText,
              secondaryText,
              fullText
            };
          });
      } else {
        // 2. Direct fallback using Google Maps Places API key from settings or env
        const directKey = (settings?.googleMapsApiKey || '').trim() ||
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
          (typeof window !== 'undefined' && (window as any).__GOOGLE_MAPS_KEY__) ||
          '';

        if (directKey) {
          const directRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': directKey,
              'X-Goog-FieldMask': 'suggestions.placePrediction.text.text,suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat'
            },
            body: JSON.stringify({
              input: trimmed,
              includedRegionCodes: ['in']
            })
          });

          if (directRes.ok) {
            const data = await directRes.json();
            const raw = data.suggestions || [];
            items = raw
              .filter((s: any) => s.placePrediction)
              .map((s: any) => {
                const pred = s.placePrediction;
                const mainText = pred.structuredFormat?.mainText?.text || pred.text?.text?.split(',')[0] || '';
                const secondaryText = pred.structuredFormat?.secondaryText?.text || '';
                const fullText = pred.text?.text || `${mainText}${secondaryText ? ', ' + secondaryText : ''}`;
                return {
                  placeId: pred.placeId,
                  mainText,
                  secondaryText,
                  fullText
                };
              });
          }
        }
      }

      // 3. Fallback to OpenStreetMap Nominatim if Google Places had no matches or failed
      if (items.length === 0 && trimmed.length >= 3) {
        try {
          const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=5`);
          if (osmRes.ok) {
            const osmData = await osmRes.json();
            if (Array.isArray(osmData)) {
              items = osmData.map((d: any, idx: number) => {
                const parts = (d.display_name || '').split(',');
                return {
                  placeId: `osm_${d.place_id || idx}`,
                  mainText: parts[0]?.trim() || d.name || 'Location',
                  secondaryText: parts.slice(1).join(',').trim(),
                  fullText: d.display_name || ''
                };
              });
            }
          }
        } catch {
          // ignore osm fallback errors
        }
      }

      lastFetchedInputRef.current = trimmed;
      setSuggestions(items);
      setIsOpen(items.length > 0);
      setActiveHighlightIndex(-1);
    } catch (err) {
      console.warn('[AddressAutocompleteInput] Autocomplete lookup failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [settings?.googleMapsApiKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPlacesSuggestions(text);
    }, 250);
  };

  const handleSelectPlace = async (suggestion: SuggestionItem) => {
    setIsOpen(false);
    setIsLoading(true);

    try {
      let addressLine1 = suggestion.fullText;
      let landmark = '';
      let city = '';
      let state = '';
      let pincode = '';

      if (suggestion.placeId.startsWith('osm_')) {
        // Parsed from fallback OSM
        const parts = suggestion.fullText.split(',').map(s => s.trim());
        addressLine1 = parts.slice(0, Math.max(1, parts.length - 3)).join(', ');
        onChange(addressLine1);
        onAddressSelect({
          addressLine1,
          landmark: '',
          city,
          state,
          pincode
        });
        return;
      }

      // Fetch place details via backend proxy
      let detailsData: any = null;
      try {
        const detailsRes = await fetch(`/api/places/details/${encodeURIComponent(suggestion.placeId)}`);
        if (detailsRes.ok) {
          const json = await detailsRes.json();
          detailsData = json.data || json;
        }
      } catch (err) {
        console.warn('[AddressAutocompleteInput] Server place details failed, trying direct:', err);
      }

      // Direct fallback if server details failed
      if (!detailsData) {
        const directKey = (settings?.googleMapsApiKey || '').trim() ||
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
          (typeof window !== 'undefined' && (window as any).__GOOGLE_MAPS_KEY__) ||
          '';

        if (directKey) {
          const directDetailsRes = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(suggestion.placeId)}`, {
            method: 'GET',
            headers: {
              'X-Goog-Api-Key': directKey,
              'X-Goog-FieldMask': 'id,displayName,formattedAddress,shortFormattedAddress,addressComponents'
            }
          });
          if (directDetailsRes.ok) {
            detailsData = await directDetailsRes.json();
          }
        }
      }

      if (detailsData && detailsData.addressComponents) {
        const components = detailsData.addressComponents;
        let streetNumber = '';
        let route = '';
        let sublocality = '';
        let premise = '';

        for (const comp of components) {
          const types: string[] = comp.types || [];
          const longText = comp.longText || comp.shortText || '';

          if (types.includes('postal_code')) {
            pincode = longText;
          } else if (types.includes('locality')) {
            city = longText;
          } else if (types.includes('administrative_area_level_1')) {
            state = longText;
          } else if (types.includes('landmark')) {
            landmark = longText;
          } else if (types.includes('sublocality_level_2') || types.includes('sublocality_level_1') || types.includes('sublocality')) {
            sublocality = sublocality ? `${sublocality}, ${longText}` : longText;
          } else if (types.includes('route')) {
            route = longText;
          } else if (types.includes('street_number')) {
            streetNumber = longText;
          } else if (types.includes('premise') || types.includes('subpremise')) {
            premise = longText;
          }
        }

        const formatted = detailsData.formattedAddress || '';
        const segments = formatted.split(',').map((s: string) => s.trim());

        // Landmark detection
        if (!landmark) {
          const landmarkSegment = segments.find((s: string) =>
            /^(opp|near|behind|next|beside|adjacent|opposite|facing)/i.test(s) ||
            /\b(temple|mosque|church|hospital|school|college|university|metro station|station|junction|landmark|chowk|circle|garden|park|bank|atm)\b/i.test(s)
          );
          if (landmarkSegment) landmark = landmarkSegment;
        }

        // Clean up Address Line 1 to omit generic country/state/pincode
        const toExclude = new Set([city.toLowerCase(), state.toLowerCase(), pincode.toLowerCase(), 'india']);
        const cleanSegments = segments.filter((s: string) => {
          const lower = s.toLowerCase();
          if (toExclude.has(lower)) return false;
          if (landmark && lower === landmark.toLowerCase()) return false;
          if (lower.includes(state.toLowerCase()) || lower.includes('india') || (pincode && lower.includes(pincode))) return false;
          return true;
        });

        const placeName = detailsData.displayName?.text || suggestion.mainText;
        let resolvedLine1 = cleanSegments.length > 0
          ? cleanSegments.join(', ')
          : ([premise, streetNumber, route, sublocality].filter(Boolean).join(', ') || placeName || formatted);

        if (placeName) {
          const lowerName = placeName.toLowerCase();
          const lowerAddress = resolvedLine1.toLowerCase();
          const isGeneric = /^\d+$/.test(placeName) || lowerName === city.toLowerCase() || lowerName === state.toLowerCase() || lowerName.includes('india');
          if (!isGeneric && !lowerAddress.includes(lowerName)) {
            resolvedLine1 = `${placeName}, ${resolvedLine1}`;
          }
        }

        addressLine1 = resolvedLine1;
      } else {
        // Fallback to text parsing
        const parts = suggestion.fullText.split(',').map(s => s.trim());
        addressLine1 = parts.slice(0, Math.max(1, parts.length - 2)).join(', ');
      }

      onChange(addressLine1);
      onAddressSelect({
        addressLine1,
        landmark,
        city,
        state,
        pincode
      });
    } catch (err) {
      console.warn('[AddressAutocompleteInput] Error handling place selection:', err);
      onChange(suggestion.fullText);
      onAddressSelect({
        addressLine1: suggestion.fullText,
        landmark: '',
        city: '',
        state: '',
        pincode: ''
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveHighlightIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveHighlightIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeHighlightIndex >= 0 && activeHighlightIndex < suggestions.length) {
        e.preventDefault();
        handleSelectPlace(suggestions[activeHighlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#9B111E]" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200/90 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-stone-100 max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between text-[10px] font-bold text-stone-500">
            <span className="flex items-center gap-1 text-[#9B111E]">
              <Sparkles className="w-3 h-3" /> Google Places Autocomplete
            </span>
            <span>Select to auto-fill details</span>
          </div>

          {suggestions.map((item, idx) => (
            <button
              key={item.placeId || idx}
              type="button"
              onClick={() => handleSelectPlace(item)}
              onMouseEnter={() => setActiveHighlightIndex(idx)}
              className={`w-full text-left p-3 text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                activeHighlightIndex === idx ? 'bg-amber-50/80 text-stone-900' : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-[#9B111E] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-stone-900 truncate text-[13px] leading-snug">
                  {item.mainText}
                </p>
                {item.secondaryText ? (
                  <p className="text-[11px] text-stone-500 truncate leading-snug mt-0.5">
                    {item.secondaryText}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-500 truncate leading-snug mt-0.5">
                    {item.fullText}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default AddressAutocompleteInput;
