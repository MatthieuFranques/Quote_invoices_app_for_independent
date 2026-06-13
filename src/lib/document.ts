import type {
  Document,
  StatutDocument,
  TypeDocument,
} from '../db/types'

const JOUR = 86_400_000

/** Crée un document vierge (brouillon) du type demandé. */
export function documentVide(type: TypeDocument): Document {
  const now = Date.now()
  const base: Document = {
    type,
    statut: 'brouillon',
    lignes: [],
    remiseGlobalePourcent: 0,
    dateCreation: now,
    updatedAt: now,
    verrouille: false,
  }
  if (type === 'devis') base.dateValidite = now + 30 * JOUR
  if (type === 'facture') base.dateEcheance = now + 30 * JOUR
  return base
}

export const labelType: Record<TypeDocument, string> = {
  devis: 'Devis',
  facture: 'Facture',
  avoir: 'Avoir',
}

export const labelStatut: Record<StatutDocument, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
}

/** Classe Tailwind (fond + texte) associée à un statut, pour les badges. */
export const couleurStatut: Record<StatutDocument, string> = {
  brouillon: 'bg-surface-container-high text-on-surface-variant',
  envoye: 'bg-surface-variant text-on-surface-variant',
  accepte: 'bg-green-100 text-green-800',
  refuse: 'bg-red-100 text-red-800',
  envoyee: 'bg-surface-variant text-on-surface-variant',
  payee: 'bg-green-100 text-green-800',
  en_retard: 'bg-red-100 text-red-800',
}
