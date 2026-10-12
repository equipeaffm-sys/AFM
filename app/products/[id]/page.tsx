import { redirect } from 'next/navigation'

// The product detail route is retired; the kennel showcase lives under /nos-chiens.
export default function ProductDetailPage() {
  redirect('/nos-chiens')
}

