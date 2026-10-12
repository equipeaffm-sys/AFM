import type { Metadata } from 'next'
import { Suspense } from 'react'
import DogsCatalog from './DogsCatalog'
import ProductSkeleton from '@/components/ProductSkeleton'

export const metadata: Metadata = {
  title: 'Nos chiots & chiens',
  description:
    'Découvrez les chiots disponibles à la réservation et les chiens adultes de race proposés à l’adoption par notre élevage.',
}

export default function NosChiensPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#252623_0%,_#1b1c1b_48%,_#191a19_100%)] px-4 py-10 text-[#e6e3dc] sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1440px]">
        <Suspense fallback={<ProductSkeleton count={6} />}>
          <DogsCatalog />
        </Suspense>
      </div>
    </main>
  )
}
