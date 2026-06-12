const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

/** Formate un montant en euros (ex : 1 234,50 €). */
export function formatEuro(montant: number): string {
  return eur.format(montant)
}

/** Timestamp ms → valeur d'un <input type="date"> (yyyy-mm-dd, heure locale). */
export function versInputDate(ts: number | undefined): string {
  if (ts == null) return ''
  const d = new Date(ts)
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

/** Valeur d'un <input type="date"> → timestamp ms (midi local pour éviter les sauts de fuseau). */
export function depuisInputDate(valeur: string): number | undefined {
  if (!valeur) return undefined
  return new Date(`${valeur}T12:00:00`).getTime()
}

/** Timestamp ms → date lisible (ex : 12/06/2026). */
export function formatDate(ts: number | undefined): string {
  if (ts == null) return '—'
  return new Date(ts).toLocaleDateString('fr-FR')
}

/** Libellés affichables des unités de prestation. */
export const libelleUnite: Record<string, string> = {
  heure: 'heure',
  jour: 'jour',
  forfait: 'forfait',
  piece: 'pièce',
}
