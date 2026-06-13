import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Page } from '../components/PageEntete'
import Feuille from '../components/Feuille'
import Icone from '../components/Icone'
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
  const navigate = useNavigate()
  const clients = useLiveQuery(() => db.clients.orderBy('nom').toArray(), [])
  const [edition, setEdition] = useState<Client | null>(null)
  const [recherche, setRecherche] = useState('')
  const [typeFiltre, setTypeFiltre] = useState<'tout' | ClientType>('tout')

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return (clients ?? []).filter((c) => {
      if (typeFiltre !== 'tout' && c.type !== typeFiltre) return false
      if (!q) return true
      return `${c.nom} ${c.email} ${c.adresse}`.toLowerCase().includes(q)
    })
  }, [clients, recherche, typeFiltre])

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

  const boutonNouveau = (
    <button
      type="button"
      onClick={() => setEdition(clientVide())}
      className="flex h-[48px] items-center gap-xs rounded-xl bg-primary px-lg text-label-md font-bold text-on-primary transition-all hover:opacity-90 active:scale-95"
    >
      <Icone nom="ajout-client" className="size-5" />
      Nouveau Client
    </button>
  )

  return (
    <Page>
      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-center">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
            Gestion des Clients
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Gérez votre base de contacts et prospects
          </p>
        </div>
        {boutonNouveau}
      </div>

      {/* Recherche + filtre */}
      <div className="mb-lg flex flex-col gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md md:flex-row">
        <div className="relative flex-1">
          <span className="absolute top-1/2 left-md -translate-y-1/2 text-on-surface-variant">
            <Icone nom="recherche" className="size-5" />
          </span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="h-[48px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest pr-md pl-[48px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Rechercher un nom, email ou ville…"
            type="text"
          />
        </div>
        <select
          value={typeFiltre}
          onChange={(e) => setTypeFiltre(e.target.value as 'tout' | ClientType)}
          className="h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-md text-body-md outline-none focus:border-primary md:w-[200px]"
        >
          <option value="tout">Tous les types</option>
          <option value="pro">Professionnel</option>
          <option value="particulier">Particulier</option>
        </select>
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-lg"
          >
            <div className="flex items-start justify-between">
              <span
                className={[
                  'rounded-full px-md py-xs text-label-sm font-bold tracking-wide uppercase',
                  c.type === 'pro'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-high text-on-surface-variant',
                ].join(' ')}
              >
                {c.type === 'pro' ? 'Pro' : 'Particulier'}
              </span>
              <div className="flex items-center gap-sm text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => setEdition(c)}
                  aria-label="Modifier"
                  className="hover:text-primary"
                >
                  <Icone nom="crayon" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/documents/nouveau?type=devis&client=${c.id}`)
                  }
                  aria-label="Nouveau devis"
                  className="hover:text-primary"
                >
                  <Icone nom="document" className="size-5" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-headline-sm text-on-surface">{c.nom}</h3>
              {c.adresse && (
                <p className="mt-xs flex items-center gap-xs text-body-md text-on-surface-variant">
                  <Icone nom="lieu" className="size-4 shrink-0" />
                  {c.adresse.split('\n')[0]}
                </p>
              )}
            </div>

            <div className="mt-auto space-y-xs pt-sm text-label-md text-on-surface-variant">
              {c.email && (
                <p className="flex items-center gap-sm">
                  <Icone nom="email" className="size-4 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </p>
              )}
              {c.telephone && (
                <p className="flex items-center gap-sm">
                  <Icone nom="telephone" className="size-4 shrink-0" />
                  {c.telephone}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Carte « ajouter » */}
        <button
          type="button"
          onClick={() => setEdition(clientVide())}
          className="flex min-h-[160px] flex-col items-center justify-center gap-sm rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low/40 p-lg text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          <Icone nom="plus-cercle" className="size-10" />
          <span className="text-label-md">Ajouter un nouveau client</span>
        </button>
      </div>

      <Feuille
        ouverte={edition !== null}
        titre={edition?.id == null ? 'Nouveau client' : 'Modifier le client'}
        onFermer={() => setEdition(null)}
      >
        {edition && (
          <div className="space-y-md">
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

            <div className="flex gap-sm pt-xs">
              <button
                type="button"
                onClick={enregistrer}
                className="flex-1 rounded-lg bg-primary px-lg py-sm font-bold text-on-primary"
              >
                Enregistrer
              </button>
              {edition.id != null && (
                <button
                  type="button"
                  onClick={supprimer}
                  className="rounded-lg border border-error/40 px-lg py-sm font-bold text-error"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        )}
      </Feuille>
    </Page>
  )
}
