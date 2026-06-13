import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Page } from '../components/PageEntete'
import Feuille from '../components/Feuille'
import Icone from '../components/Icone'
import { ChampNombre, ChampSelect, ChampTexte } from '../components/champs'
import { db } from '../db/db'
import type { PrestationCatalogue, Unite } from '../db/types'
import { formatEuro, libelleUnite } from '../lib/format'

function prestationVide(): PrestationCatalogue {
  return { libelle: '', prixUnitaireHT: 0, unite: 'heure', tauxTva: 20 }
}

const UNITES: { valeur: Unite; label: string }[] = [
  { valeur: 'heure', label: 'Heure' },
  { valeur: 'jour', label: 'Jour' },
  { valeur: 'forfait', label: 'Forfait' },
  { valeur: 'piece', label: 'Pièce' },
]

const TAUX_TVA = [
  { valeur: 20, label: '20 % (normal)' },
  { valeur: 10, label: '10 % (intermédiaire)' },
  { valeur: 5.5, label: '5,5 % (réduit)' },
  { valeur: 0, label: '0 % (non applicable)' },
]

export default function Catalogue() {
  const prestations = useLiveQuery(
    () => db.catalogue.orderBy('libelle').toArray(),
    [],
  )
  const [edition, setEdition] = useState<PrestationCatalogue | null>(null)
  const [recherche, setRecherche] = useState('')
  const [uniteFiltre, setUniteFiltre] = useState<'tout' | Unite>('tout')
  const [tvaFiltre, setTvaFiltre] = useState<'tout' | string>('tout')

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return (prestations ?? []).filter((p) => {
      if (uniteFiltre !== 'tout' && p.unite !== uniteFiltre) return false
      if (tvaFiltre !== 'tout' && String(p.tauxTva) !== tvaFiltre) return false
      if (!q) return true
      return p.libelle.toLowerCase().includes(q)
    })
  }, [prestations, recherche, uniteFiltre, tvaFiltre])

  async function enregistrer() {
    if (!edition) return
    if (!edition.libelle.trim()) {
      window.alert('Le libellé est obligatoire.')
      return
    }
    if (edition.id == null) {
      await db.catalogue.add(edition)
    } else {
      await db.catalogue.put(edition)
    }
    setEdition(null)
  }

  async function supprimer(p: PrestationCatalogue) {
    if (p.id == null) return
    if (!window.confirm(`Supprimer « ${p.libelle} » ?`)) return
    await db.catalogue.delete(p.id)
  }

  function set<K extends keyof PrestationCatalogue>(
    cle: K,
    valeur: PrestationCatalogue[K],
  ) {
    setEdition((p) => (p ? { ...p, [cle]: valeur } : p))
  }

  return (
    <Page>
      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-center">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
            Catalogue des Prestations
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Gérez vos articles et services réutilisables pour une facturation
            rapide.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEdition(prestationVide())}
          className="flex h-[48px] items-center gap-xs rounded-xl bg-primary px-lg text-label-md font-bold text-on-primary transition-all hover:opacity-90 active:scale-95"
        >
          <Icone nom="plus" className="size-5" />
          Ajouter au catalogue
        </button>
      </div>

      {/* Recherche + filtres */}
      <div className="mb-lg flex flex-col gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md md:flex-row">
        <div className="relative flex-1">
          <span className="absolute top-1/2 left-md -translate-y-1/2 text-on-surface-variant">
            <Icone nom="recherche" className="size-5" />
          </span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="h-[48px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest pr-md pl-[48px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Rechercher par libellé…"
            type="text"
          />
        </div>
        <select
          value={uniteFiltre}
          onChange={(e) => setUniteFiltre(e.target.value as 'tout' | Unite)}
          className="h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-md text-body-md outline-none focus:border-primary"
        >
          <option value="tout">Toutes les unités</option>
          {UNITES.map((u) => (
            <option key={u.valeur} value={u.valeur}>
              {u.label}
            </option>
          ))}
        </select>
        <select
          value={tvaFiltre}
          onChange={(e) => setTvaFiltre(e.target.value)}
          className="h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-md text-body-md outline-none focus:border-primary"
        >
          <option value="tout">Taux TVA</option>
          {TAUX_TVA.map((t) => (
            <option key={t.valeur} value={String(t.valeur)}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-label-md text-on-surface-variant">
              <th className="p-md font-semibold">Libellé</th>
              <th className="p-md font-semibold">Prix Unitaire HT</th>
              <th className="p-md font-semibold">Unité</th>
              <th className="p-md font-semibold">TVA</th>
              <th className="p-md text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {liste.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-lg text-body-md text-on-surface-variant"
                >
                  Aucune prestation. Ajoutez vos lignes réutilisables.
                </td>
              </tr>
            )}
            {liste.map((p) => (
              <tr
                key={p.id}
                className="border-b border-outline-variant transition-colors last:border-0 hover:bg-surface-container-low"
              >
                <td className="p-md">
                  <button
                    type="button"
                    onClick={() => setEdition(p)}
                    className="text-headline-sm font-semibold text-primary hover:underline"
                  >
                    {p.libelle}
                  </button>
                </td>
                <td className="p-md font-bold text-on-surface">
                  {formatEuro(p.prixUnitaireHT)}
                </td>
                <td className="p-md">
                  <span className="rounded-full bg-secondary-container px-md py-xs text-label-sm text-on-secondary-container capitalize">
                    {libelleUnite[p.unite]}
                  </span>
                </td>
                <td className="p-md">
                  {p.tauxTva === 0 ? (
                    <span className="rounded-full bg-tertiary-fixed px-md py-xs text-label-sm text-on-tertiary-fixed">
                      0% (Exo)
                    </span>
                  ) : (
                    <span className="text-body-md text-on-surface-variant">
                      {p.tauxTva}%
                    </span>
                  )}
                </td>
                <td className="p-md">
                  <div className="flex items-center justify-end gap-md text-on-surface-variant">
                    <button
                      type="button"
                      onClick={() => setEdition(p)}
                      aria-label="Modifier"
                      className="hover:text-primary"
                    >
                      <Icone nom="crayon" className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => supprimer(p)}
                      aria-label="Supprimer"
                      className="hover:text-error"
                    >
                      <Icone nom="poubelle" className="size-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Feuille
        ouverte={edition !== null}
        titre={
          edition?.id == null ? 'Nouvelle prestation' : 'Modifier la prestation'
        }
        onFermer={() => setEdition(null)}
      >
        {edition && (
          <div className="space-y-md">
            <ChampTexte
              label="Libellé"
              valeur={edition.libelle}
              onChange={(v) => set('libelle', v)}
            />
            <ChampNombre
              label="Prix unitaire HT"
              valeur={edition.prixUnitaireHT}
              onChange={(v) => set('prixUnitaireHT', v)}
              step="0.01"
              suffixe="€"
            />
            <ChampSelect<Unite>
              label="Unité"
              valeur={edition.unite}
              onChange={(v) => set('unite', v)}
              options={UNITES}
            />
            <ChampSelect<number>
              label="Taux de TVA"
              valeur={edition.tauxTva}
              onChange={(v) => set('tauxTva', v)}
              options={TAUX_TVA}
            />

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
                  onClick={() => {
                    supprimer(edition)
                    setEdition(null)
                  }}
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
