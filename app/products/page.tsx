import { redirect } from 'next/navigation'

export default function ProductsPage() {
  // The e-commerce catalogue has been replaced by the kennel showcase.
  redirect('/nos-chiens')
}

