import type { LigneDocument, PrestationCatalogue, Unite } from '../db/types'
import { totalLigneHT } from '../db/calculs'
import { formatEuro } from '../lib/format'

const UNITES: Unite[] = ['heure', 'jour', 'forfait', 'piece']
const TAUX_TVA = [20, 10, 5.5, 0]

const petitInput =
  'w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-600'

/** Ligne vierge (saisie libre). */
function ligneVide(): LigneDocument {
  return {
    libelle: '',
    quantite: 1,
    prixUnitaireHT: 0,
    unite: 'forfait',
    tauxTva: 20,
  }
}

/** Convertit une prestation du catalogue en ligne de document. */
function depuisCatalogue(p: PrestationCatalogue): LigneDocument {
  return {
    libelle: p.libelle,
    quantite: 1,
    prixUnitaireHT: p.prixUnitaireHT,
    unite: p.unite,
    tauxTva: p.tauxTva,
  }
}

/**
 * Éditeur des lignes d'un devis / facture : ajout depuis le catalogue ou en
 * saisie libre, modification quantité / prix / TVA / remise, suppression.
 */
export default function LignesEditeur({
  lignes,
  catalogue,
  onChange,
}: {
  lignes: LigneDocument[]
  catalogue: PrestationCatalogue[]
  onChange: (lignes: LigneDocument[]) => void
}) {
  function modifier<K extends keyof LigneDocument>(
    index: number,
    cle: K,
    valeur: LigneDocument[K],
  ) {
    onChange(
      lignes.map((l, i) => (i === index ? { ...l, [cle]: valeur } : l)),
    )
  }

  function supprimer(index: number) {
    onChange(lignes.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {lignes.map((ligne, i) => (
        <div
          key={i}
          className="space-y-2 rounded-lg border border-gray-200 p-3"
        >
          <div className="flex items-start gap-2">
            <input
              className={petitInput}
              placeholder="Libellé de la prestation"
              value={ligne.libelle}
              onChange={(e) => modifier(i, 'libelle', e.target.value)}
            />
            <button
              type="button"
              onClick={() => supprimer(i)}
              className="shrink-0 px-1 text-xl leading-none text-gray-400"
              aria-label="Supprimer la ligne"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="block">
              <span className="mb-0.5 block text-xs text-gray-500">Qté</span>
              <input
                className={petitInput}
                type="number"
                inputMode="decimal"
                step="any"
                value={ligne.quantite}
                onChange={(e) =>
                  modifier(i, 'quantite', Number(e.target.value) || 0)
                }
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-gray-500">
                Prix HT
              </span>
              <input
                className={petitInput}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={ligne.prixUnitaireHT}
                onChange={(e) =>
                  modifier(i, 'prixUnitaireHT', Number(e.target.value) || 0)
                }
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-gray-500">Unité</span>
              <select
                className={petitInput}
                value={ligne.unite}
                onChange={(e) => modifier(i, 'unite', e.target.value as Unite)}
              >
                {UNITES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-0.5 block text-xs text-gray-500">TVA</span>
              <select
                className={petitInput}
                value={ligne.tauxTva}
                onChange={(e) =>
                  modifier(i, 'tauxTva', Number(e.target.value))
                }
              >
                {TAUX_TVA.map((t) => (
                  <option key={t} value={t}>
                    {t} %
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              Remise
              <input
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-600"
                type="number"
                inputMode="decimal"
                step="any"
                value={ligne.remisePourcent ?? 0}
                onChange={(e) =>
                  modifier(i, 'remisePourcent', Number(e.target.value) || 0)
                }
              />
              %
            </label>
            <span className="text-sm font-semibold text-gray-900">
              {formatEuro(totalLigneHT(ligne))} HT
            </span>
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2 sm:flex-row">
        {catalogue.length > 0 && (
          <select
            className="flex-1 rounded-lg border border-blue-700 px-3 py-2.5 text-sm font-semibold text-blue-700"
            value=""
            onChange={(e) => {
              const p = catalogue.find((c) => String(c.id) === e.target.value)
              if (p) onChange([...lignes, depuisCatalogue(p)])
              e.target.value = ''
            }}
          >
            <option value="">+ Depuis le catalogue…</option>
            {catalogue.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle} — {formatEuro(p.prixUnitaireHT)}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => onChange([...lignes, ligneVide()])}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700"
        >
          + Ligne libre
        </button>
      </div>
    </div>
  )
}
