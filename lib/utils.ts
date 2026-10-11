export function formatPrice(priceCents: number, currency = 'EUR'): string {
  const amount = priceCents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
