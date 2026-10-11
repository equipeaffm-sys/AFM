'use client'

import { Activity } from 'lucide-react'

export default function AdminAuditPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-[#FEFDF5] flex items-center gap-3">
          <Activity className="w-7 h-7 text-[#C5A059]" />
          Journal d’audit
        </h1>
        <p className="text-xs text-[#888888] mt-1">
          Aucune source de journal d’audit n’est configurée pour cette vue.
        </p>
      </div>
      <div className="border border-[#222222] bg-[#111111] p-8 text-center text-sm text-[#888888]">
        Aucune entrée d’audit disponible.
      </div>
    </div>
  )
}
