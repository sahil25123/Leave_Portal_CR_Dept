function AppShell({ title, subtitle, children }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </main>
  );
}

export default AppShell;
