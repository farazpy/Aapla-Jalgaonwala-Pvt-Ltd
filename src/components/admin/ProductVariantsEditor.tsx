'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Scale, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { ProductVariant } from '@/types';

interface ProductVariantsEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice?: string | number;
  baseMrp?: string | number;
}

const COMMON_PRESETS = [
  { label: '50g', weight: '50g', multiplier: 0.55 },
  { label: '100g', weight: '100g', multiplier: 1.0 },
  { label: '200g', weight: '200g', multiplier: 1.95 },
  { label: '250g', weight: '250g', multiplier: 2.35 },
  { label: '400g', weight: '400g', multiplier: 3.7 },
  { label: '500g', weight: '500g', multiplier: 4.5 },
  { label: '1 kg', weight: '1kg', multiplier: 8.5 },
  { label: '2 kg', weight: '2kg', multiplier: 16.5 },
  { label: '5 kg', weight: '5kg', multiplier: 40.0 }
];

export const ProductVariantsEditor: React.FC<ProductVariantsEditorProps> = ({
  variants,
  onChange,
  basePrice = 0,
  baseMrp = 0
}) => {
  const [newWeight, setNewWeight] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newMrp, setNewMrp] = useState('');
  const [newStock, setNewStock] = useState('100');
  const [showAddForm, setShowAddForm] = useState(false);

  const numBasePrice = Number(basePrice) || 100;
  const numBaseMrp = Number(baseMrp) || numBasePrice;

  const handleAddVariant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const weightTrim = newWeight.trim();
    if (!weightTrim) return;

    const priceNum = Number(newPrice) || numBasePrice;
    const mrpNum = Number(newMrp) || Number(newPrice) || numBaseMrp;
    const stockNum = Number(newStock) >= 0 ? Number(newStock) : 100;

    const newVar: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      weight: weightTrim,
      price: priceNum,
      mrp: mrpNum,
      stock: stockNum
    };

    onChange([...variants, newVar]);
    setNewWeight('');
    setNewPrice('');
    setNewMrp('');
    setNewStock('100');
    setShowAddForm(false);
  };

  const handleQuickAddPreset = (preset: { weight: string; multiplier: number }) => {
    // Avoid duplicate weights
    const existing = variants.find(v => v.weight.toLowerCase() === preset.weight.toLowerCase());
    if (existing) return;

    const calcPrice = Math.round(numBasePrice * preset.multiplier);
    const calcMrp = Math.round(numBaseMrp * preset.multiplier);

    const newVar: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      weight: preset.weight,
      price: calcPrice,
      mrp: calcMrp > calcPrice ? calcMrp : calcPrice,
      stock: 100
    };

    onChange([...variants, newVar]);
  };

  const handleGenerate3PackSet = () => {
    const packs: ProductVariant[] = [
      {
        id: `var-${Date.now()}-200g`,
        weight: '200g',
        price: 70,
        mrp: 80,
        stock: 100
      },
      {
        id: `var-${Date.now()}-500g`,
        weight: '500g',
        price: 170,
        mrp: 195,
        stock: 100
      },
      {
        id: `var-${Date.now()}-1kg`,
        weight: '1kg',
        price: 340,
        mrp: 390,
        stock: 100
      }
    ];

    onChange(packs);
  };

  const handleGenerateStandardSet = () => {
    const standardPacks = [
      { weight: '100g', multiplier: 1.0 },
      { weight: '250g', multiplier: 2.35 },
      { weight: '500g', multiplier: 4.5 },
      { weight: '1kg', multiplier: 8.5 }
    ];

    const generated: ProductVariant[] = standardPacks.map((p, idx) => {
      const calcPrice = Math.round(numBasePrice * p.multiplier);
      const calcMrp = Math.round(numBaseMrp * p.multiplier);
      return {
        id: `var-${Date.now()}-${idx + 1}`,
        weight: p.weight,
        price: calcPrice,
        mrp: calcMrp > calcPrice ? calcMrp : calcPrice,
        stock: 100
      };
    });

    onChange(generated);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  const handleRemoveVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5" id="product-variants-editor">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              Weight Variations & Pricing
            </h3>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              MySQL Database Synced
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Configure different weight pack sizes (e.g. 100g, 250g, 500g, 1kg) with individual prices and stock inventory in MySQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGenerate3PackSet}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Auto-generate 3 variations: 200g = ₹70, 500g = ₹170, and 1kg = ₹340"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Generate 3 Packs (200g=₹70, 500g=₹170, 1kg=₹340)</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateStandardSet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Auto-generate variations calculated proportionally from base price"
          >
            <RefreshCw className="w-3 h-3 text-amber-600" />
            <span>Standard Proportional</span>
          </button>
        </div>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700 block">
          Quick Add Pack Sizes:
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_PRESETS.map((preset) => {
            const isAdded = variants.some(v => v.weight.toLowerCase() === preset.weight.toLowerCase());
            return (
              <button
                key={preset.weight}
                type="button"
                onClick={() => handleQuickAddPreset(preset)}
                disabled={isAdded}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all border ${
                  isAdded
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                    : 'bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border-stone-200 hover:border-amber-300 shadow-2xs active:scale-95'
                }`}
              >
                {isAdded ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3 text-stone-500" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Variations Table / Cards */}
      {variants.length === 0 ? (
        <div className="p-6 bg-stone-50/80 rounded-2xl border border-dashed border-stone-300 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200/60">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">No Custom Variations Added Yet</p>
            <p className="text-[11px] text-stone-500 max-w-md mx-auto mt-0.5">
              This product will sell using its primary base Price & Net Weight. Click a preset above or add variations below to offer multiple pack sizes to customers.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleGenerate3PackSet}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Generate 3 Packs (200g = ₹70, 500g = ₹170, 1kg = ₹340)</span>
            </button>
            <button
              type="button"
              onClick={handleGenerateStandardSet}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 shadow-2xs transition-all"
            >
              Standard Proportional (100g, 250g, 500g, 1kg)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
            <span className="col-span-3">Weight / Pack Size</span>
            <span className="col-span-3">Offer Price (₹)</span>
            <span className="col-span-2">MRP (₹)</span>
            <span className="col-span-2">Stock</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          <div className="space-y-2.5">
            {variants.map((variant, idx) => {
              const priceVal = Number(variant.price) || 0;
              const mrpVal = Number(variant.mrp) || priceVal;
              const discountPct = mrpVal > priceVal ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;

              return (
                <div
                  key={variant.id || idx}
                  className="bg-stone-50/90 border border-stone-200/90 hover:border-amber-300 rounded-2xl p-3.5 transition-all space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
                >
                  {/* Weight */}
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={variant.weight}
                      onChange={(e) => handleUpdateVariant(idx, 'weight', e.target.value)}
                      placeholder="e.g. 250g"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
                    />
                  </div>

                  {/* Offer Price */}
                  <div className="sm:col-span-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.price}
                        onChange={(e) => handleUpdateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="Price"
                        className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-black text-[#9B111E] focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
                      />
                    </div>
                  </div>

                  {/* MRP */}
                  <div className="sm:col-span-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.mrp}
                        onChange={(e) => handleUpdateVariant(idx, 'mrp', parseFloat(e.target.value) || 0)}
                        placeholder="MRP"
                        className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
                      />
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={variant.stock !== undefined ? variant.stock : 100}
                      onChange={(e) => handleUpdateVariant(idx, 'stock', parseInt(e.target.value, 10) || 0)}
                      placeholder="Stock"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
                    />
                  </div>

                  {/* Actions & Discount Info */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                    {discountPct > 0 ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {discountPct}% OFF
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-medium">Standard</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors shrink-0"
                      title="Remove variation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Add Variation Form */}
      {showAddForm ? (
        <form onSubmit={handleAddVariant} className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Add Custom Weight Variation</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-stone-500 hover:text-stone-800 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Weight / Unit *</label>
              <input
                type="text"
                required
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="e.g. 750g or 3kg"
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g. 240"
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold text-[#9B111E] focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={newMrp}
                onChange={(e) => setNewMrp(e.target.value)}
                placeholder="e.g. 299"
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Stock Units</label>
              <input
                type="number"
                min="0"
                step="1"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#9B111E]/20 focus:border-[#9B111E] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-[#9B111E] hover:bg-[#800A14] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variation to Product</span>
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full py-2.5 px-4 rounded-xl border border-dashed border-stone-300 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 text-stone-700 hover:text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-stone-500" />
          <span>+ Add Custom Weight Variation</span>
        </button>
      )}
    </div>
  );
};
