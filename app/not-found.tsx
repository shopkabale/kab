import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
      <div className="text-6xl mb-6">🏜️</div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
        404 - Item Not Found
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
        Oops! We couldn't find the page or product you're looking for. It might have been sold, removed, or the link is broken.
      </p>
      <Link 
        href="/" 
        className="rounded-lg bg-primary px-8 py-4 text-base font-bold text-white shadow-md hover:bg-sky-500 transition-all"
      >
        Back to Homepage
      </Link>
    </div>
  );
}