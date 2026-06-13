import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import LignesEditeur from '../components/LignesEditeur'
import Icone from '../components/Icone'
import { db, getParametres } from '../db/db'
import { calculerTotaux } from '../db/calculs'
import type { Document, TypeDocument } from '../db/types'
import { documentVide, labelStatut, labelType } from '../lib/document'
import { formatEuro, versInputDate, depuisInputDate } from '../lib/format'

const JOUR = 86_400_000

export default function EditeurDocument() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const clients = useLiveQuery(() => db.clients.orderBy('nom').toArray(), [])
  const catalogue = useLiveQuery(
    () => db.catalogue.orderBy('libelle').toArray(),
    [],
  )
  const parametres = useLiveQuery(() => getParametres(), [])

  const [doc, setDoc] = useState<Document | null>(null)
  const [facturX, setFacturX] = useState(true)

  // Chargement : document existant ou nouveau brouillon du type demandé.
  useEffect(() => {
    if (id === 'nouveau') {
      const type = (params.get('type') as TypeDocument) ?? 'devis'
      const d = documentVide(type)
      const cid = params.get('client')
      if (cid) d.clientId = Number(cid)
      setDoc(d)
    } else if (id) {
      db.documents.get(Number(id)).then((d) => setDoc(d ?? null))
    }
  }, [id, params])

  if (!doc) {
    return <p className="p-lg text-on-surface-variant">Chargement…</p>
  }

  const verrouille = doc.verrouille
  const totaux = calculerTotaux(doc)
  const netAPayer = totaux.totalTTC - (doc.acompte ?? 0)
  const client = clients?.find((c) => c.id === doc.clientId)
  const numeroAffiche = doc.numero ?? 'N° auto (à l’émission)'

  function set<K extends keyof Document>(cle: K, valeur: Document[K]) {
    setDoc((d) => (d ? { ...d, [cle]: valeur } : d))
  }

  function changerType(type: TypeDocument) {
    setDoc((d) => {
      if (!d) return d
      const now = Date.now()
      return {
        ...d,
        type,
        dateValidite: type === 'devis' ? (d.dateValidite ?? now + 30 * JOUR) : undefined,
        dateEcheance: type === 'facture' ? (d.dateEcheance ?? now + 30 * JOUR) : undefined,
      }
    })
  }

  async function enregistrer() {
    if (!doc) return
    const aSauver: Document = { ...doc, updatedAt: Date.now() }
    if (aSauver.id == null) {
      const newId = await db.documents.add(aSauver)
      setDoc({ ...aSauver, id: Number(newId) })
    } else {
      await db.documents.put(aSauver)
    }
    navigate('/')
  }

  async function genererPdf() {
    if (!doc) return
    const p = await getParametres()
    const { telechargerPdf } = await import('../pdf/generer')
    await telechargerPdf(doc, p, client)
  }

  const dateEmission = versInputDate(doc.dateEmission ?? doc.dateCreation)

  return (
    <div className="px-margin-mobile py-lg pb-[140px] md:px-margin-desktop md:pb-[88px]">
      <div className="mx-auto max-w-[1200px]">
        {/* En-tête document */}
        <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-end">
          <div>
            <div className="mb-xs flex items-center gap-sm">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-on-surface-variant hover:text-on-surface"
                aria-label="Retour"
              >
                <Icone nom="retour" className="size-6" />
              </button>
              <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
                {doc.id == null
                  ? 'Création de Document'
                  : labelType[doc.type]}
              </h1>
            </div>
            <div className="flex items-center gap-md pl-[2.25rem]">
              <select
                value={doc.type}
                disabled={verrouille || doc.numero != null}
                onChange={(e) => changerType(e.target.value as TypeDocument)}
                className="rounded-lg border-none bg-surface-container-high px-md py-sm text-label-md outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="devis">Devis</option>
                <option value="facture">Facture</option>
              </select>
              <span className="text-label-md text-on-surface-variant">
                {numeroAffiche} · {labelStatut[doc.statut]}
              </span>
            </div>
          </div>

          {/* Bascule Factur-X (B2B) */}
          <div className="flex items-center gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
            <div className="flex flex-col">
              <span className="text-label-md">Norme Factur-X</span>
              <span className="text-label-sm text-on-surface-variant">
                {client?.type === 'pro' ? 'Recommandé (B2B)' : 'Optionnel (B2C)'}
              </span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={facturX}
                onChange={(e) => setFacturX(e.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-outline-variant transition-colors peer-checked:bg-primary" />
              <span className="absolute left-[2px] size-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        {verrouille && (
          <p className="mb-lg rounded-lg bg-tertiary-fixed px-md py-sm text-label-md text-on-tertiary-fixed">
            Document émis : non modifiable (corrigez par un avoir).
          </p>
        )}

        {/* Grille bento */}
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
          {/* Client */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg md:col-span-8">
            <div className="mb-md flex items-center justify-between">
              <h2 className="text-headline-sm">Client</h2>
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="flex items-center gap-xs text-label-md text-primary"
              >
                <Icone nom="ajout-client" className="size-5" />
                Gérer
              </button>
            </div>
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              <label className="block">
                <span className="mb-xs block text-label-sm text-on-surface-variant">
                  Sélectionner un client
                </span>
                <select
                  disabled={verrouille}
                  value={doc.clientId ?? ''}
                  onChange={(e) =>
                    set(
                      'clientId',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md outline-none focus:border-primary"
                >
                  <option value="">— Aucun client —</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="mb-xs block text-label-sm text-on-surface-variant">
                  SIRET Client {client?.type === 'pro' ? '(Obligatoire Pro)' : ''}
                </span>
                <input
                  readOnly
                  value={client?.siret ?? ''}
                  placeholder="—"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-md text-on-surface-variant outline-none"
                />
              </div>
              <label className="block md:col-span-2">
                <span className="mb-xs block text-label-sm text-on-surface-variant">
                  Adresse de livraison
                </span>
                <textarea
                  disabled={verrouille}
                  rows={2}
                  value={doc.adresseLivraison ?? ''}
                  onChange={(e) => set('adresseLivraison', e.target.value)}
                  placeholder="Saisir une adresse spécifique si différente de la facturation"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg md:col-span-4">
            <h2 className="mb-md text-headline-sm">Dates</h2>
            <div className="space-y-md">
              <label className="block">
                <span className="mb-xs block text-label-sm text-on-surface-variant">
                  Date d'émission
                </span>
                <input
                  type="date"
                  disabled={verrouille}
                  value={dateEmission}
                  onChange={(e) =>
                    set('dateCreation', depuisInputDate(e.target.value) ?? Date.now())
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-xs block text-label-sm text-on-surface-variant">
                  {doc.type === 'devis' ? 'Validité' : 'Échéance'}
                </span>
                <input
                  type="date"
                  disabled={verrouille}
                  value={versInputDate(
                    doc.type === 'devis' ? doc.dateValidite : doc.dateEcheance,
                  )}
                  onChange={(e) =>
                    set(
                      doc.type === 'devis' ? 'dateValidite' : 'dateEcheance',
                      depuisInputDate(e.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>

          {/* Lignes */}
          <div className="md:col-span-12">
            <LignesEditeur
              lignes={doc.lignes}
              catalogue={catalogue ?? []}
              onChange={(lignes) => set('lignes', lignes)}
              verrouille={verrouille}
            />
          </div>

          {/* Notes & mentions */}
          <div className="space-y-gutter md:col-span-7">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <h2 className="mb-md text-headline-sm">Notes &amp; Mentions</h2>
              <div className="space-y-md">
                <label className="block">
                  <span className="mb-xs block text-label-sm text-on-surface-variant">
                    Notes sur le document
                  </span>
                  <textarea
                    disabled={verrouille}
                    rows={3}
                    value={doc.notes ?? ''}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Informations complémentaires pour le client…"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md outline-none focus:border-primary"
                  />
                </label>
                <div className="rounded-lg border border-outline-variant bg-surface-container p-md">
                  <span className="mb-xs block text-label-sm text-on-surface-variant">
                    Mentions légales (auto-remplies)
                  </span>
                  <p className="text-label-sm leading-relaxed text-on-surface-variant">
                    {parametres && !parametres.tvaApplicable
                      ? `${parametres.mentionTva}. `
                      : ''}
                    {parametres?.penalitesRetard}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Totaux */}
          <div className="md:col-span-5">
            <div className="space-y-md rounded-xl bg-primary p-lg text-on-primary shadow-lg">
              <div className="flex items-center justify-between text-label-md">
                <span>Total HT</span>
                <span>{formatEuro(totaux.totalHT)}</span>
              </div>
              {Object.entries(totaux.tvaParTaux).length === 0 ? (
                <div className="flex items-center justify-between border-b border-on-primary/20 pb-sm text-label-md opacity-80">
                  <span>TVA</span>
                  <span>{formatEuro(0)}</span>
                </div>
              ) : (
                Object.entries(totaux.tvaParTaux).map(([taux, montant]) => (
                  <div
                    key={taux}
                    className="flex items-center justify-between border-b border-on-primary/20 pb-sm text-label-md opacity-80"
                  >
                    <span>TVA ({taux}%)</span>
                    <span>{formatEuro(montant)}</span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between text-label-md">
                <span>Remise globale (%)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  disabled={verrouille}
                  value={doc.remiseGlobalePourcent ?? 0}
                  onChange={(e) =>
                    set('remiseGlobalePourcent', Number(e.target.value) || 0)
                  }
                  className="w-16 rounded border-none bg-white/10 px-xs py-1 text-right text-on-primary outline-none placeholder:text-on-primary/40 focus:ring-0"
                  placeholder="0"
                />
              </div>
              {doc.type === 'facture' && (
                <div className="flex items-center justify-between text-label-md">
                  <span>Acompte versé (€)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    disabled={verrouille}
                    value={doc.acompte ?? 0}
                    onChange={(e) =>
                      set('acompte', Number(e.target.value) || 0)
                    }
                    className="w-24 rounded border-none bg-white/10 px-xs py-1 text-right text-on-primary outline-none placeholder:text-on-primary/40 focus:ring-0"
                    placeholder="0"
                  />
                </div>
              )}
              <div className="flex items-center justify-between pt-md">
                <span className="text-headline-sm">TOTAL TTC</span>
                <span className="text-display-lg">
                  {formatEuro(totaux.totalTTC)}
                </span>
              </div>
              {doc.type === 'facture' && (doc.acompte ?? 0) > 0 && (
                <div className="flex items-center justify-between border-t border-on-primary/20 pt-sm font-bold">
                  <span>Net à payer</span>
                  <span>{formatEuro(netAPayer)}</span>
                </div>
              )}
            </div>

            {/* Actions rapides */}
            <div className="mt-gutter flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-high p-md">
              {!verrouille && (
                <button
                  type="button"
                  onClick={enregistrer}
                  className="flex w-full items-center justify-between rounded-lg bg-surface-container-lowest p-md text-on-surface transition-all hover:shadow-sm"
                >
                  <span className="text-label-md">Enregistrer en brouillon</span>
                  <Icone nom="enregistrer" className="size-5 text-outline" />
                </button>
              )}
              <button
                type="button"
                onClick={genererPdf}
                className="flex w-full items-center justify-between rounded-lg bg-surface-container-lowest p-md text-on-surface transition-all hover:shadow-sm"
              >
                <span className="text-label-md">Aperçu PDF</span>
                <Icone nom="pdf" className="size-5 text-outline" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'action flottante — mobile */}
      <div className="pointer-events-none fixed bottom-[80px] left-0 w-full px-margin-mobile md:hidden">
        <button
          type="button"
          onClick={genererPdf}
          className="pointer-events-auto flex h-[56px] w-full items-center justify-center gap-md rounded-xl bg-primary font-bold text-on-primary shadow-xl active:scale-95"
        >
          <Icone nom="envoyer" className="size-5" />
          Générer &amp; Envoyer
        </button>
      </div>

      {/* Barre d'action collante — desktop */}
      <div className="fixed right-0 bottom-0 z-40 hidden w-[calc(100%-280px)] justify-end gap-md border-t border-outline-variant bg-surface px-margin-desktop py-md md:flex">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-[48px] rounded-xl bg-surface-container-high px-lg text-label-md text-on-surface-variant transition-colors hover:bg-outline-variant"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={genererPdf}
          className="flex h-[48px] items-center gap-md rounded-xl bg-primary px-lg font-bold text-on-primary transition-opacity hover:opacity-90"
        >
          <Icone nom="envoyer" className="size-5" />
          Générer &amp; Envoyer
        </button>
      </div>
    </div>
  )
}
