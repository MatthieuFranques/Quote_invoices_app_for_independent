import { db } from './db'
import type {
  Client,
  Document,
  ParametresEntreprise,
  PrestationCatalogue,
} from './types'

/** Format du fichier de sauvegarde complet (backup / changement d'appareil). */
export interface SauvegardeJSON {
  /** Version du format, pour gérer les évolutions futures. */
  version: 1
  exporteLe: string
  parametres: ParametresEntreprise | null
  clients: Client[]
  catalogue: PrestationCatalogue[]
  documents: Document[]
}

/** Lit toutes les tables et construit l'objet de sauvegarde. */
export async function exporterDonnees(): Promise<SauvegardeJSON> {
  const [parametres, clients, catalogue, documents] = await Promise.all([
    db.parametres.get('company'),
    db.clients.toArray(),
    db.catalogue.toArray(),
    db.documents.toArray(),
  ])
  return {
    version: 1,
    exporteLe: new Date().toISOString(),
    parametres: parametres ?? null,
    clients,
    catalogue,
    documents,
  }
}

/** Déclenche le téléchargement de la sauvegarde sous forme de fichier JSON. */
export async function telechargerSauvegarde(): Promise<void> {
  const donnees = await exporterDonnees()
  const blob = new Blob([JSON.stringify(donnees, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `sauvegarde-devis-factures-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Erreur levée quand un fichier importé n'a pas le bon format. */
export class FichierInvalideError extends Error {}

/** Valide la structure minimale d'un objet de sauvegarde. */
function validerSauvegarde(data: unknown): asserts data is SauvegardeJSON {
  if (typeof data !== 'object' || data === null) {
    throw new FichierInvalideError('Fichier de sauvegarde illisible.')
  }
  const d = data as Record<string, unknown>
  if (d.version !== 1) {
    throw new FichierInvalideError('Version de sauvegarde non reconnue.')
  }
  if (
    !Array.isArray(d.clients) ||
    !Array.isArray(d.catalogue) ||
    !Array.isArray(d.documents)
  ) {
    throw new FichierInvalideError('Structure de sauvegarde invalide.')
  }
}

/**
 * Remplace toutes les données locales par celles de la sauvegarde.
 *
 * Opération destructive : effectuée dans une transaction pour rester atomique
 * (tout ou rien). L'appelant est responsable de la confirmation utilisateur.
 */
export async function importerDonnees(data: unknown): Promise<void> {
  validerSauvegarde(data)
  await db.transaction(
    'rw',
    db.parametres,
    db.clients,
    db.catalogue,
    db.documents,
    async () => {
      await Promise.all([
        db.parametres.clear(),
        db.clients.clear(),
        db.catalogue.clear(),
        db.documents.clear(),
      ])
      if (data.parametres) await db.parametres.put(data.parametres)
      if (data.clients.length) await db.clients.bulkPut(data.clients)
      if (data.catalogue.length) await db.catalogue.bulkPut(data.catalogue)
      if (data.documents.length) await db.documents.bulkPut(data.documents)
    },
  )
}

/** Lit un fichier choisi par l'utilisateur et importe son contenu. */
export async function importerDepuisFichier(fichier: File): Promise<void> {
  const texte = await fichier.text()
  let data: unknown
  try {
    data = JSON.parse(texte)
  } catch {
    throw new FichierInvalideError('Le fichier n’est pas un JSON valide.')
  }
  await importerDonnees(data)
}

// --- Export / import des documents uniquement (non destructif) -------------

/** Format d'un export ne contenant que des documents. */
export interface ExportDocumentsJSON {
  type: 'documents'
  version: 1
  exporteLe: string
  documents: Document[]
}

/** Télécharge uniquement les documents (devis / factures / avoirs). */
export async function telechargerDocuments(): Promise<void> {
  const documents = await db.documents.toArray()
  const data: ExportDocumentsJSON = {
    type: 'documents',
    version: 1,
    exporteLe: new Date().toISOString(),
    documents,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `documents-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Importe des documents et les AJOUTE aux documents existants (fusion, non
 * destructif). Les `id` d'origine sont retirés : la base attribue de nouveaux
 * identifiants pour éviter tout écrasement. Renvoie le nombre ajouté.
 *
 * Accepte aussi un fichier de sauvegarde complète (on n'importe que ses
 * documents).
 */
export async function importerDocumentsDepuisFichier(
  fichier: File,
): Promise<number> {
  const texte = await fichier.text()
  let data: unknown
  try {
    data = JSON.parse(texte)
  } catch {
    throw new FichierInvalideError('Le fichier n’est pas un JSON valide.')
  }
  if (typeof data !== 'object' || data === null) {
    throw new FichierInvalideError('Fichier illisible.')
  }
  const docs = (data as Record<string, unknown>).documents
  if (!Array.isArray(docs)) {
    throw new FichierInvalideError('Aucun document trouvé dans le fichier.')
  }
  const sansId = (docs as Document[]).map((d) => {
    const copie = { ...d }
    delete copie.id
    return copie
  })
  await db.documents.bulkAdd(sansId)
  return sansId.length
}
