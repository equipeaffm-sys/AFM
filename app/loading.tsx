import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 space-y-4">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-spin">
        <Sparkles className="w-6 h-6" />
      </div>
      <p className="font-serif tracking-widest text-amber-500 uppercase text-xs font-semibold">
        Maison L&M — Chargement...
      </p>
    </div>
  )
}
