function LoadingState({ label = "Loading..." }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
      {label}
    </div>
  );
}

export default LoadingState;
