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

/** Timestamp ms → date courte (ex : 12 oct. 2026). */
export function formatDateCourte(ts: number | undefined): string {
  if (ts == null) return '—'
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Initiales d'un nom (max 2 lettres) pour les pastilles d'avatar. */
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (mots.length === 0) return '?'
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase()
  return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase()
}

/** Couleur d'avatar stable dérivée du nom (tokens Material). */
const COULEURS_AVATAR = [
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-error-container text-on-error-container',
  'bg-primary-fixed text-on-primary-fixed',
]
export function couleurAvatar(nom: string): string {
  let somme = 0
  for (let i = 0; i < nom.length; i++) somme += nom.charCodeAt(i)
  return COULEURS_AVATAR[somme % COULEURS_AVATAR.length]
}

/** Libellés affichables des unités de prestation. */
export const libelleUnite: Record<string, string> = {
  heure: 'heure',
  jour: 'jour',
  forfait: 'forfait',
  piece: 'pièce',
}
