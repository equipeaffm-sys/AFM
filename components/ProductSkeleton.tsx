export default function ProductSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-label="Chargement des produits" aria-busy="true" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#242523] shadow-sm"
        >
          <div className="skeleton-shimmer relative aspect-[4/5] w-full overflow-hidden bg-[#2d2e2b]">
            <div className="absolute left-3 top-3 h-5 w-20 rounded-full bg-white/[0.08] sm:left-4 sm:top-4 sm:h-6 sm:w-28" />
          </div>
          <div className="flex flex-1 flex-col justify-between space-y-3 p-3.5 sm:space-y-4 sm:p-5">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="skeleton-shimmer h-4 w-3/4 rounded sm:h-6" />
              <div className="skeleton-shimmer h-3 w-full rounded sm:h-4" />
              <div className="skeleton-shimmer h-3 w-2/3 rounded sm:h-4" />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
              <div className="skeleton-shimmer h-4 w-16 rounded sm:h-6 sm:w-24" />
              <div className="skeleton-shimmer h-7 w-16 rounded-lg sm:h-8 sm:w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
