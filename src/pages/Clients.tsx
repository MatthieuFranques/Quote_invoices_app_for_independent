import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PageEntete from '../components/PageEntete'
import Feuille from '../components/Feuille'
import { ChampSelect, ChampTexte, ChampZone } from '../components/champs'
import { db } from '../db/db'
import type { Client, ClientType } from '../db/types'

/** Formulaire vide pour un nouveau client (professionnel par défaut). */
function clientVide(): Client {
  return {
    type: 'pro',
    nom: '',
    adresse: '',
    email: '',
    telephone: '',
    siret: '',
    createdAt: Date.now(),
  }
}

export default function Clients() {
  const clients = useLiveQuery(() => db.clients.orderBy('nom').toArray(), [])
  const [edition, setEdition] = useState<Client | null>(null)

  async function enregistrer() {
    if (!edition) return
    if (!edition.nom.trim()) {
      window.alert('Le nom du client est obligatoire.')
      return
    }
    if (edition.id == null) {
      await db.clients.add(edition)
    } else {
      await db.clients.put(edition)
    }
    setEdition(null)
  }

  async function supprimer() {
    if (edition?.id == null) return
    if (!window.confirm(`Supprimer le client « ${edition.nom} » ?`)) return
    await db.clients.delete(edition.id)
    setEdition(null)
  }

  function set<K extends keyof Client>(cle: K, valeur: Client[K]) {
    setEdition((c) => (c ? { ...c, [cle]: valeur } : c))
  }

  return (
    <div>
      <PageEntete
        titre="Clients"
        actions={
          <button
            type="button"
            onClick={() => setEdition(clientVide())}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            + Nouveau
          </button>
        }
      />

      {clients?.length === 0 && (
        <p className="p-4 text-gray-600">
          Aucun client. Créez-en un avec « + Nouveau ».
        </p>
      )}

      <ul className="divide-y divide-gray-100">
        {clients?.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setEdition(c)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{c.nom}</p>
                <p className="truncate text-sm text-gray-500">
                  {c.email || c.telephone || 'Sans contact'}
                </p>
              </div>
              <span
                className={[
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  c.type === 'pro'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600',
                ].join(' ')}
              >
                {c.type === 'pro' ? 'Pro' : 'Particulier'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Feuille
        ouverte={edition !== null}
        titre={edition?.id == null ? 'Nouveau client' : 'Modifier le client'}
        onFermer={() => setEdition(null)}
      >
        {edition && (
          <div className="space-y-4">
            <ChampSelect<ClientType>
              label="Type de client"
              valeur={edition.type}
              onChange={(v) => set('type', v)}
              options={[
                { valeur: 'pro', label: 'Professionnel (B2B)' },
                { valeur: 'particulier', label: 'Particulier (B2C)' },
              ]}
            />
            <ChampTexte
              label="Nom / raison sociale"
              valeur={edition.nom}
              onChange={(v) => set('nom', v)}
            />
            <ChampZone
              label="Adresse"
              valeur={edition.adresse}
              onChange={(v) => set('adresse', v)}
              rows={2}
            />
            <ChampTexte
              label="Email"
              valeur={edition.email}
              onChange={(v) => set('email', v)}
              type="email"
              inputMode="email"
            />
            <ChampTexte
              label="Téléphone"
              valeur={edition.telephone}
              onChange={(v) => set('telephone', v)}
              type="tel"
              inputMode="tel"
            />
            {edition.type === 'pro' && (
              <ChampTexte
                label="SIRET (obligatoire en B2B)"
                valeur={edition.siret ?? ''}
                onChange={(v) => set('siret', v)}
                inputMode="numeric"
              />
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={enregistrer}
                className="flex-1 rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white"
              >
                Enregistrer
              </button>
              {edition.id != null && (
                <button
                  type="button"
                  onClick={supprimer}
                  className="rounded-lg border border-red-300 px-4 py-3 font-semibold text-red-600"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        )}
      </Feuille>
    </div>
  )
}
