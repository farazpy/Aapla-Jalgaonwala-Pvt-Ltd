'use client';

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-stone-200/40">
      <div className="h-full bg-gradient-to-r from-[#9B111E] via-[#D9531E] to-amber-500 animate-pulse shadow-[0_0_10px_#9B111E]" />
    </div>
  );
}
