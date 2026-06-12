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
  brouillon: 'bg-gray-100 text-gray-600',
  envoye: 'bg-amber-100 text-amber-700',
  accepte: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-700',
  envoyee: 'bg-amber-100 text-amber-700',
  payee: 'bg-green-100 text-green-700',
  en_retard: 'bg-red-100 text-red-700',
}
