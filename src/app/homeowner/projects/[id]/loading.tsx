export default function ProjectLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-stone-100" />
        <div className="space-y-1.5">
          <div className="h-6 w-48 bg-stone-150" />
          <div className="h-3 w-28 bg-stone-100" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-64 border border-ink-900/10 bg-white" />
          <div className="h-40 border border-ink-900/10 bg-white" />
          <div className="h-32 border border-ink-900/10 bg-white" />
        </div>
        <div className="space-y-4">
          <div className="h-56 border border-ink-900/10 bg-white" />
          <div className="h-32 border border-ink-900/10 bg-white" />
        </div>
      </div>
    </div>
  )
}
