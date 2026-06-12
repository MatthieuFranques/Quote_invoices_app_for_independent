const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

/** Formate un montant en euros (ex : 1 234,50 €). */
export function formatEuro(montant: number): string {
  return eur.format(montant)
}

/** Libellés affichables des unités de prestation. */
export const libelleUnite: Record<string, string> = {
  heure: 'heure',
  jour: 'jour',
  forfait: 'forfait',
  piece: 'pièce',
}
