export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-8 text-center">
      <h1 className="text-3xl font-semibold">LightSignal</h1>
      <p className="mt-2 text-neutral-500">Forecast, plan, and grow — with real data.</p>
      <div className="mt-6 flex gap-3 justify-center">
        <a href="/demo/overview" className="px-4 py-2 rounded-xl bg-black text-white">Try Demo</a>
        <a href="/login" className="px-4 py-2 rounded-xl border">Log in</a>
        <a href="/signup" className="px-4 py-2 rounded-xl border">Sign up</a>
      </div>
    </main>
  );
}

