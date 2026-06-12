import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import LignesEditeur from '../components/LignesEditeur'
import { ChampNombre, ChampZone } from '../components/champs'
import { db } from '../db/db'
import { calculerTotaux } from '../db/calculs'
import type { Document, TypeDocument } from '../db/types'
import { documentVide, labelStatut, labelType } from '../lib/document'
import { formatEuro, versInputDate, depuisInputDate } from '../lib/format'

export default function EditeurDocument() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const clients = useLiveQuery(() => db.clients.orderBy('nom').toArray(), [])
  const catalogue = useLiveQuery(
    () => db.catalogue.orderBy('libelle').toArray(),
    [],
  )

  const [doc, setDoc] = useState<Document | null>(null)

  // Chargement : document existant ou nouveau brouillon du type demandé.
  useEffect(() => {
    if (id === 'nouveau') {
      const type = (params.get('type') as TypeDocument) ?? 'devis'
      setDoc(documentVide(type))
    } else if (id) {
      db.documents.get(Number(id)).then((d) => setDoc(d ?? null))
    }
  }, [id, params])

  if (!doc) {
    return <p className="p-4 text-gray-600">Chargement…</p>
  }

  const verrouille = doc.verrouille
  const totaux = calculerTotaux(doc)
  const netAPayer = totaux.totalTTC - (doc.acompte ?? 0)

  function set<K extends keyof Document>(cle: K, valeur: Document[K]) {
    setDoc((d) => (d ? { ...d, [cle]: valeur } : d))
  }

  async function enregistrer() {
    if (!doc) return
    const aSauver: Document = { ...doc, updatedAt: Date.now() }
    if (aSauver.id == null) {
      await db.documents.add(aSauver)
    } else {
      await db.documents.put(aSauver)
    }
    navigate('/documents')
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-3">
        <button
          type="button"
          onClick={() => navigate('/documents')}
          className="px-1 text-2xl leading-none text-gray-500"
          aria-label="Retour"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-gray-900">
            {doc.numero ?? `${labelType[doc.type]} (brouillon)`}
          </h1>
          <p className="text-xs text-gray-500">{labelStatut[doc.statut]}</p>
        </div>
        {!verrouille && (
          <button
            type="button"
            onClick={enregistrer}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Enregistrer
          </button>
        )}
      </header>

      {verrouille && (
        <p className="bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Document émis : non modifiable.
        </p>
      )}

      <div className="space-y-6 p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Client
          </span>
          <select
            disabled={verrouille}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-blue-600"
            value={doc.clientId ?? ''}
            onChange={(e) =>
              set(
                'clientId',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          >
            <option value="">— Aucun client —</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>

        {doc.type === 'devis' && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Date de validité
            </span>
            <input
              type="date"
              disabled={verrouille}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-blue-600"
              value={versInputDate(doc.dateValidite)}
              onChange={(e) =>
                set('dateValidite', depuisInputDate(e.target.value))
              }
            />
          </label>
        )}

        {doc.type === 'facture' && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Date d’échéance
            </span>
            <input
              type="date"
              disabled={verrouille}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-blue-600"
              value={versInputDate(doc.dateEcheance)}
              onChange={(e) =>
                set('dateEcheance', depuisInputDate(e.target.value))
              }
            />
          </label>
        )}

        <div>
          <h2 className="mb-2 text-sm font-bold tracking-wide text-gray-500 uppercase">
            Lignes
          </h2>
          <LignesEditeur
            lignes={doc.lignes}
            catalogue={catalogue ?? []}
            onChange={(lignes) => set('lignes', lignes)}
          />
        </div>

        <ChampNombre
          label="Remise globale"
          valeur={doc.remiseGlobalePourcent ?? 0}
          onChange={(v) => set('remiseGlobalePourcent', v)}
          suffixe="%"
        />

        {doc.type === 'facture' && (
          <ChampNombre
            label="Acompte déjà versé"
            valeur={doc.acompte ?? 0}
            onChange={(v) => set('acompte', v)}
            step="0.01"
            suffixe="€"
          />
        )}

        <ChampZone
          label="Notes"
          valeur={doc.notes ?? ''}
          onChange={(v) => set('notes', v)}
          rows={2}
        />

        {/* Totaux calculés en direct. */}
        <div className="space-y-1 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total HT</span>
            <span className="font-medium">{formatEuro(totaux.totalHT)}</span>
          </div>
          {Object.entries(totaux.tvaParTaux).map(([taux, montant]) => (
            <div key={taux} className="flex justify-between text-gray-600">
              <span>TVA {taux} %</span>
              <span>{formatEuro(montant)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-bold">
            <span>Total TTC</span>
            <span>{formatEuro(totaux.totalTTC)}</span>
          </div>
          {doc.type === 'facture' && (doc.acompte ?? 0) > 0 && (
            <div className="flex justify-between pt-1 font-semibold text-blue-700">
              <span>Net à payer</span>
              <span>{formatEuro(netAPayer)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
