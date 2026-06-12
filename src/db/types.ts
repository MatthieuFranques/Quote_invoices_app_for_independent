// Types du domaine métier : paramètres entreprise, clients, catalogue, documents.
// Tout est stocké en local (IndexedDB via Dexie). Aucune donnée ne part sur un serveur.

/** Client professionnel (B2B, Factur-X requis) ou particulier (B2C, PDF simple). */
export type ClientType = 'pro' | 'particulier'

/** Unité d'une ligne de prestation. */
export type Unite = 'heure' | 'jour' | 'forfait' | 'piece'

/** Nature d'un document. Un avoir corrige une facture déjà émise. */
export type TypeDocument = 'devis' | 'facture' | 'avoir'

/** Catégorie d'opération (mention renforcée Factur-X B2B). */
export type CategorieOperation = 'biens' | 'services' | 'mixte'

/** Statuts d'un devis : brouillon → envoyé → accepté / refusé. */
export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse'

/** Statuts d'une facture : brouillon → envoyée → payée / en retard. */
export type StatutFacture = 'brouillon' | 'envoyee' | 'payee' | 'en_retard'

export type StatutDocument = StatutDevis | StatutFacture

/** Modèles visuels de PDF proposés. */
export type ModelePdf = 'classique' | 'moderne' | 'minimal'

/**
 * Paramètres de l'entreprise. Enregistrement unique (singleton) : `id` vaut
 * toujours `'company'`.
 */
export interface ParametresEntreprise {
  id: 'company'
  // Identité
  nom: string
  adresse: string
  siret: string
  telephone: string
  email: string
  /** Logo encodé en data URL (image stockée en local). */
  logo?: string
  // Mentions légales
  /** false pour un auto-entrepreneur en franchise de TVA. */
  tvaApplicable: boolean
  /** Ex : « TVA non applicable, art. 293 B du CGI ». */
  mentionTva: string
  conditionsPaiement: string
  penalitesRetard: string
  iban: string
  // Numérotation automatique séquentielle (obligation légale : sans trou).
  prefixeDevis: string
  prefixeFacture: string
  prefixeAvoir: string
  compteurDevis: number
  compteurFacture: number
  compteurAvoir: number
  // Email pré-rempli (modifiable).
  emailObjet: string
  emailCorps: string
  // Rendu PDF
  modelePdf: ModelePdf
  couleurAccent: string
}

/** Fiche client. */
export interface Client {
  id?: number
  type: ClientType
  nom: string
  adresse: string
  email: string
  telephone: string
  /** Obligatoire pour un client professionnel (B2B). */
  siret?: string
  createdAt: number
}

/** Prestation réutilisable du catalogue. */
export interface PrestationCatalogue {
  id?: number
  libelle: string
  prixUnitaireHT: number
  unite: Unite
  /** Taux de TVA en pourcentage (ex : 20, 10, 5.5, 0). */
  tauxTva: number
}

/** Une ligne d'un devis ou d'une facture. */
export interface LigneDocument {
  libelle: string
  quantite: number
  prixUnitaireHT: number
  unite: Unite
  tauxTva: number
  /** Remise sur la ligne, en pourcentage. */
  remisePourcent?: number
}

/**
 * Copie figée des infos émetteur au moment de l'émission. Garantit l'immuabilité
 * d'une facture émise même si les paramètres entreprise changent plus tard.
 */
export interface SnapshotEmetteur {
  nom: string
  adresse: string
  siret: string
  email: string
  telephone: string
  mentionTva: string
  conditionsPaiement: string
  penalitesRetard: string
  iban: string
}

/** Copie figée des infos client au moment de l'émission. */
export interface SnapshotClient {
  type: ClientType
  nom: string
  adresse: string
  email: string
  telephone: string
  siret?: string
}

/**
 * Document : devis, facture ou avoir. Les totaux ne sont pas stockés ici ; ils
 * sont recalculés à partir des lignes (sauf snapshots à l'émission, à venir).
 */
export interface Document {
  id?: number
  type: TypeDocument
  /** Numéro séquentiel, attribué à l'émission uniquement (ex : FAC-2026-001). */
  numero?: string
  statut: StatutDocument
  // Client : lien + copie figée à l'émission.
  clientId?: number
  clientSnapshot?: SnapshotClient
  emetteurSnapshot?: SnapshotEmetteur
  lignes: LigneDocument[]
  /** Remise globale en pourcentage, appliquée après les remises de ligne. */
  remiseGlobalePourcent?: number
  // Dates (timestamps ms).
  dateCreation: number
  dateEmission?: number
  /** Date de validité (devis). */
  dateValidite?: number
  /** Date d'échéance (facture). */
  dateEcheance?: number
  /** Acompte déjà versé (facture). */
  acompte?: number
  // Mentions renforcées B2B / Factur-X.
  categorieOperation?: CategorieOperation
  adresseLivraison?: string
  // Verrouillage : une facture émise est immuable (modifiable seulement par avoir).
  verrouille: boolean
  /** Facture d'origine corrigée par cet avoir. */
  factureOrigineId?: number
  /** Devis converti à l'origine de cette facture. */
  devisOrigineId?: number
  notes?: string
  updatedAt: number
}
