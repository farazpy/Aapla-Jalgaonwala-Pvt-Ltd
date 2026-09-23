import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 text-center font-sans">
      <div className="max-w-md bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <span className="text-4xl font-black text-[#9B111E]">404</span>
        <h1 className="text-xl font-bold text-stone-900">Page Not Found</h1>
        <p className="text-xs text-stone-500">
          The page or resource you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#9B111E] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#800A14] transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
