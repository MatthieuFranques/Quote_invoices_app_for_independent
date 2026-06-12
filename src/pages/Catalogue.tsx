import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PageEntete from '../components/PageEntete'
import Feuille from '../components/Feuille'
import { ChampNombre, ChampSelect, ChampTexte } from '../components/champs'
import { db } from '../db/db'
import type { PrestationCatalogue, Unite } from '../db/types'
import { formatEuro, libelleUnite } from '../lib/format'

/** Prestation vide pour une nouvelle entrée du catalogue. */
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

  async function supprimer() {
    if (edition?.id == null) return
    if (!window.confirm(`Supprimer « ${edition.libelle} » ?`)) return
    await db.catalogue.delete(edition.id)
    setEdition(null)
  }

  function set<K extends keyof PrestationCatalogue>(
    cle: K,
    valeur: PrestationCatalogue[K],
  ) {
    setEdition((p) => (p ? { ...p, [cle]: valeur } : p))
  }

  return (
    <div>
      <PageEntete
        titre="Catalogue"
        actions={
          <button
            type="button"
            onClick={() => setEdition(prestationVide())}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            + Nouveau
          </button>
        }
      />

      {prestations?.length === 0 && (
        <p className="p-4 text-gray-600">
          Aucune prestation. Ajoutez vos lignes réutilisables avec « + Nouveau ».
        </p>
      )}

      <ul className="divide-y divide-gray-100">
        {prestations?.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setEdition(p)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {p.libelle}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {formatEuro(p.prixUnitaireHT)} HT / {libelleUnite[p.unite]} ·
                  TVA {p.tauxTva} %
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Feuille
        ouverte={edition !== null}
        titre={
          edition?.id == null ? 'Nouvelle prestation' : 'Modifier la prestation'
        }
        onFermer={() => setEdition(null)}
      >
        {edition && (
          <div className="space-y-4">
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
