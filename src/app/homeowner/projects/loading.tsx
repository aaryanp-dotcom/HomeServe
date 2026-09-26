export default function ProjectsListLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-stone-150" />
          <div className="h-3 w-32 bg-stone-100" />
        </div>
        <div className="h-11 w-32 bg-stone-150" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 border border-ink-900/10 bg-white" />)}
      </div>
    </div>
  )
}
