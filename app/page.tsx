export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
        Kabale Online
      </h1>
      <p className="mt-6 text-lg leading-8 text-slate-600 font-medium">
        The Better Way to Inform Your Community.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <div className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500">
          Coming Soon
        </div>
      </div>
    </div>
  );
}