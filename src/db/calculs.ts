import type { Document, LigneDocument } from './types'

/** Total HT d'une ligne, remise de ligne appliquée. */
export function totalLigneHT(ligne: LigneDocument): number {
  const brut = ligne.quantite * ligne.prixUnitaireHT
  const remise = (ligne.remisePourcent ?? 0) / 100
  return brut * (1 - remise)
}

export interface TotauxDocument {
  /** Total HT après remises de ligne et remise globale. */
  totalHT: number
  /** Montant de TVA par taux (clé = taux en %, valeur = montant). */
  tvaParTaux: Record<number, number>
  /** Total de la TVA, tous taux confondus. */
  totalTva: number
  /** Total TTC = HT + TVA. */
  totalTTC: number
}

/**
 * Calcule les totaux d'un document à partir de ses lignes.
 *
 * La remise globale s'applique proportionnellement sur le HT de chaque ligne,
 * afin que la TVA par taux reste correcte.
 */
export function calculerTotaux(
  doc: Pick<Document, 'lignes' | 'remiseGlobalePourcent'>,
): TotauxDocument {
  const facteurRemise = 1 - (doc.remiseGlobalePourcent ?? 0) / 100

  const tvaParTaux: Record<number, number> = {}
  let totalHT = 0
  let totalTva = 0

  for (const ligne of doc.lignes) {
    const ht = totalLigneHT(ligne) * facteurRemise
    const tva = ht * (ligne.tauxTva / 100)
    totalHT += ht
    totalTva += tva
    tvaParTaux[ligne.tauxTva] = (tvaParTaux[ligne.tauxTva] ?? 0) + tva
  }

  return {
    totalHT: arrondi(totalHT),
    tvaParTaux: Object.fromEntries(
      Object.entries(tvaParTaux).map(([taux, montant]) => [
        Number(taux),
        arrondi(montant),
      ]),
    ),
    totalTva: arrondi(totalTva),
    totalTTC: arrondi(totalHT + totalTva),
  }
}

/** Arrondi monétaire à 2 décimales. */
function arrondi(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
