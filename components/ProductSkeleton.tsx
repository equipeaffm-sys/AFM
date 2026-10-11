export default function ProductSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#242523] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col shadow-sm animate-pulse relative"
        >
          {/* Shimmer wave effect */}
          <div className="h-80 w-full bg-[#2d2e2b] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            <div className="absolute top-4 left-4 h-6 w-28 bg-white/[0.08] rounded-full" />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-6 w-3/4 bg-white/[0.08] rounded" />
              <div className="h-4 w-full bg-white/[0.04] rounded" />
              <div className="h-4 w-2/3 bg-white/[0.04] rounded" />
            </div>
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <div className="h-6 w-24 bg-white/[0.08] rounded" />
              <div className="h-8 w-28 bg-[#665d4d] rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
