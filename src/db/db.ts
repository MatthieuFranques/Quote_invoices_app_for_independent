import Dexie, { type Table } from 'dexie'
import type {
  Client,
  Document,
  ParametresEntreprise,
  PrestationCatalogue,
} from './types'

/**
 * Base de données locale (IndexedDB). Tout reste sur l'appareil.
 *
 * Index déclarés dans `stores` : seules les colonnes sur lesquelles on filtre /
 * trie sont indexées. Le reste des champs est stocké tel quel dans l'objet.
 */
export class AppDatabase extends Dexie {
  parametres!: Table<ParametresEntreprise, string>
  clients!: Table<Client, number>
  catalogue!: Table<PrestationCatalogue, number>
  documents!: Table<Document, number>

  constructor() {
    super('devis-factures')
    this.version(1).stores({
      parametres: 'id',
      clients: '++id, nom, type, createdAt',
      catalogue: '++id, libelle',
      documents: '++id, type, statut, numero, clientId, dateCreation',
    })
  }
}

export const db = new AppDatabase()

// Crée la ligne paramètres par défaut au tout premier lancement (création de la
// base). Doit se faire ici et non dans une lecture : écrire pendant un
// `liveQuery` déclenche « Readwrite transaction in liveQuery context ».
db.on('populate', () => {
  db.parametres.put(parametresParDefaut())
})

/** Paramètres entreprise par défaut (auto-entrepreneur en franchise de TVA). */
export function parametresParDefaut(): ParametresEntreprise {
  const annee = new Date().getFullYear()
  return {
    id: 'company',
    nom: '',
    adresse: '',
    siret: '',
    telephone: '',
    email: '',
    tvaApplicable: false,
    mentionTva: 'TVA non applicable, art. 293 B du CGI',
    conditionsPaiement: 'Paiement à 30 jours.',
    penalitesRetard:
      'En cas de retard de paiement, application de pénalités au taux légal en vigueur.',
    iban: '',
    prefixeDevis: `DEV-${annee}-`,
    prefixeFacture: `FAC-${annee}-`,
    prefixeAvoir: `AV-${annee}-`,
    compteurDevis: 0,
    compteurFacture: 0,
    compteurAvoir: 0,
    emailObjet: '{type} {numero} — {entreprise}',
    emailCorps:
      'Bonjour,\n\nVeuillez trouver ci-joint votre document.\n\nCordialement,',
    modelePdf: 'classique',
    couleurAccent: '#1d4ed8',
  }
}

/**
 * Lit les paramètres entreprise, en les créant à la valeur par défaut au premier
 * lancement (onboarding).
 */
export async function getParametres(): Promise<ParametresEntreprise> {
  const existant = await db.parametres.get('company')
  return existant ?? parametresParDefaut()
}
