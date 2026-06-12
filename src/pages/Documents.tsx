import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import PageEntete from '../components/PageEntete'
import { db } from '../db/db'
import { calculerTotaux } from '../db/calculs'
import { couleurStatut, labelStatut, labelType } from '../lib/document'
import { formatDate, formatEuro } from '../lib/format'

export default function Documents() {
  const navigate = useNavigate()
  const documents = useLiveQuery(
    () => db.documents.orderBy('dateCreation').reverse().toArray(),
    [],
  )
  const clients = useLiveQuery(() => db.clients.toArray(), [])

  const nomClient = (id?: number) =>
    clients?.find((c) => c.id === id)?.nom ?? 'Sans client'

  return (
    <div>
      <PageEntete
        titre="Documents"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/documents/nouveau?type=devis')}
              className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white"
            >
              + Devis
            </button>
            <button
              type="button"
              onClick={() => navigate('/documents/nouveau?type=facture')}
              className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white"
            >
              + Facture
            </button>
          </div>
        }
      />

      {documents?.length === 0 && (
        <p className="p-4 text-gray-600">
          Aucun document. Créez un devis ou une facture ci-dessus.
        </p>
      )}

      <ul className="divide-y divide-gray-100">
        {documents?.map((d) => {
          const ttc = calculerTotaux(d).totalTTC
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => navigate(`/documents/${d.id}`)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {d.numero ?? `${labelType[d.type]} (brouillon)`}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {nomClient(d.clientId)} · {formatDate(d.dateCreation)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold text-gray-900">
                    {formatEuro(ttc)}
                  </span>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      couleurStatut[d.statut],
                    ].join(' ')}
                  >
                    {labelStatut[d.statut]}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
