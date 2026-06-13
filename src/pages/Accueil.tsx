import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getParametres } from '../db/db'
import { calculerTotaux } from '../db/calculs'
import { couleurStatut, labelStatut, labelType } from '../lib/document'
import {
  couleurAvatar,
  formatDateCourte,
  formatEuro,
  initiales,
} from '../lib/format'
import { Page } from '../components/PageEntete'
import Icone from '../components/Icone'

/** Plafond de chiffre d'affaires micro-entreprise (prestations de services). */
const PLAFOND_SERVICES = 77_700

type Filtre = 'tout' | 'devis' | 'factures' | 'retard'

const FILTRES: { cle: Filtre; label: string }[] = [
  { cle: 'tout', label: 'Tout' },
  { cle: 'devis', label: 'Devis' },
  { cle: 'factures', label: 'Factures' },
  { cle: 'retard', label: 'En retard' },
]

export default function Accueil() {
  const navigate = useNavigate()
  const documents = useLiveQuery(
    () => db.documents.orderBy('dateCreation').reverse().toArray(),
    [],
  )
  const clients = useLiveQuery(() => db.clients.toArray(), [])
  const params = useLiveQuery(() => getParametres(), [])

  const [filtre, setFiltre] = useState<Filtre>('tout')
  const [recherche, setRecherche] = useState('')

  const nomClient = (id?: number) =>
    clients?.find((c) => c.id === id)?.nom ?? 'Sans client'

  // Statistiques (factures payées du mois / de l'année + en attente).
  const stats = useMemo(() => {
    const now = new Date()
    let caMois = 0
    let caAnnee = 0
    let enAttente = 0
    for (const d of documents ?? []) {
      if (d.type !== 'facture') continue
      const ttc = calculerTotaux(d).totalTTC
      if (d.statut === 'envoyee' || d.statut === 'en_retard') enAttente++
      if (d.statut === 'payee') {
        const date = new Date(d.dateEmission ?? d.dateCreation)
        if (date.getFullYear() === now.getFullYear()) {
          caAnnee += ttc
          if (date.getMonth() === now.getMonth()) caMois += ttc
        }
      }
    }
    return { caMois, caAnnee, enAttente }
  }, [documents])

  const plafondPct = Math.min(
    100,
    Math.round((stats.caAnnee / PLAFOND_SERVICES) * 100),
  )
  const franchise = params ? !params.tvaApplicable : false

  // Liste filtrée + recherche.
  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return (documents ?? []).filter((d) => {
      if (filtre === 'devis' && d.type !== 'devis') return false
      if (filtre === 'factures' && d.type !== 'facture') return false
      if (filtre === 'retard' && d.statut !== 'en_retard') return false
      if (!q) return true
      const hay = `${d.numero ?? ''} ${nomClient(d.clientId)}`.toLowerCase()
      return hay.includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, clients, filtre, recherche])

  const prenom = params?.nom?.trim().split(/\s+/)[0] || ''

  return (
    <Page>
      {/* En-tête + recherche */}
      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-center">
        <div>
          <h1 className="text-headline-lg text-on-surface">
            Bonjour{prenom ? `, ${prenom}` : ''} 👋
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Voici l'état de votre activité aujourd'hui.
          </p>
        </div>
        <div className="relative w-full md:w-[320px]">
          <span className="absolute top-1/2 left-md -translate-y-1/2 text-on-surface-variant">
            <Icone nom="recherche" className="size-5" />
          </span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-lowest pr-md pl-[48px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Rechercher un client, un numéro…"
            type="text"
          />
        </div>
      </div>

      {/* Cartes synthèse */}
      <div className="mb-xl grid grid-cols-1 gap-lg md:grid-cols-3">
        <div className="flex flex-col gap-base rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <span className="text-label-md text-on-surface-variant">
            CA du mois
          </span>
          <span className="text-headline-lg font-bold text-on-surface">
            {formatEuro(stats.caMois)}
          </span>
        </div>

        <div className="flex flex-col gap-base rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
          <span className="text-label-md text-on-surface-variant">
            CA de l'année
          </span>
          <span className="text-headline-lg font-bold text-on-surface">
            {formatEuro(stats.caAnnee)}
          </span>
          {franchise && (
            <>
              <div className="mt-sm h-1 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${plafondPct}%` }}
                />
              </div>
              <p className="text-label-sm text-on-surface-variant">
                Plafond auto-entrepreneur : {plafondPct}% atteint
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-primary-container p-lg text-on-primary-container">
          <div>
            <span className="text-label-md opacity-80">Factures en attente</span>
            <div className="text-display-lg">{stats.enAttente}</div>
          </div>
          <span className="opacity-20">
            <Icone nom="horloge" className="size-12" />
          </span>
        </div>
      </div>

      {/* Documents */}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col justify-between gap-md border-b border-outline-variant p-lg md:flex-row md:items-center">
          <h2 className="text-headline-sm">Documents récents</h2>
          <div className="no-scrollbar flex items-center gap-xs overflow-x-auto">
            {FILTRES.map((f) => (
              <button
                key={f.cle}
                type="button"
                onClick={() => setFiltre(f.cle)}
                className={[
                  'rounded-full px-md py-xs text-label-sm whitespace-nowrap transition-colors',
                  filtre === f.cle
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* En-têtes de colonnes (desktop) */}
        <div className="hidden grid-cols-5 bg-surface-container-low px-lg py-md text-label-md text-on-surface-variant md:grid">
          <div>Numéro</div>
          <div>Client</div>
          <div>Date</div>
          <div>Montant TTC</div>
          <div className="text-right">Statut</div>
        </div>

        {liste.length === 0 && (
          <p className="p-lg text-body-md text-on-surface-variant">
            Aucun document. Créez un devis ou une facture.
          </p>
        )}

        <div className="flex flex-col">
          {liste.map((d) => {
            const ttc = calculerTotaux(d).totalTTC
            const nom = nomClient(d.clientId)
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => navigate(`/documents/${d.id}`)}
                className="group grid grid-cols-1 items-center border-b border-outline-variant px-lg py-md text-left transition-colors last:border-0 hover:bg-surface-container-low md:grid-cols-5"
              >
                <div className="text-label-md font-bold text-primary group-hover:underline">
                  {d.numero ?? `${labelType[d.type]} (brouillon)`}
                </div>
                <div className="mt-xs flex items-center gap-sm md:mt-0">
                  <span
                    className={[
                      'flex size-8 items-center justify-center rounded-full text-xs font-bold',
                      couleurAvatar(nom),
                    ].join(' ')}
                  >
                    {initiales(nom)}
                  </span>
                  <span className="text-body-md">{nom}</span>
                </div>
                <div className="mt-xs text-body-md text-on-surface-variant md:mt-0">
                  {formatDateCourte(d.dateEmission ?? d.dateCreation)}
                </div>
                <div className="mt-xs text-body-md font-bold md:mt-0">
                  {formatEuro(ttc)}
                </div>
                <div className="mt-sm flex justify-start md:mt-0 md:justify-end">
                  <span
                    className={[
                      'rounded-full px-md py-xs text-label-sm',
                      couleurStatut[d.statut],
                    ].join(' ')}
                  >
                    {labelStatut[d.statut]}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Page>
  )
}
