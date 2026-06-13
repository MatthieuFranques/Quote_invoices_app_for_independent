import type { LigneDocument, PrestationCatalogue, Unite } from '../db/types'
import { totalLigneHT } from '../db/calculs'
import { formatEuro, libelleUnite } from '../lib/format'
import Icone from './Icone'

const UNITES: Unite[] = ['heure', 'jour', 'forfait', 'piece']
const TAUX_TVA = [20, 10, 5.5, 0]

const cellInput =
  'w-full border-none bg-transparent text-body-md outline-none focus:ring-0'

function ligneVide(): LigneDocument {
  return {
    libelle: '',
    quantite: 1,
    prixUnitaireHT: 0,
    unite: 'forfait',
    tauxTva: 20,
  }
}

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
 * Éditeur des lignes d'un devis / facture, présenté en tableau (maquette).
 * Ajout depuis le catalogue ou en saisie libre ; édition quantité / prix / TVA /
 * remise ; suppression. Verrouillé si le document est émis.
 */
export default function LignesEditeur({
  lignes,
  catalogue,
  onChange,
  verrouille = false,
}: {
  lignes: LigneDocument[]
  catalogue: PrestationCatalogue[]
  onChange: (lignes: LigneDocument[]) => void
  verrouille?: boolean
}) {
  function modifier<K extends keyof LigneDocument>(
    index: number,
    cle: K,
    valeur: LigneDocument[K],
  ) {
    onChange(lignes.map((l, i) => (i === index ? { ...l, [cle]: valeur } : l)))
  }

  function supprimer(index: number) {
    onChange(lignes.filter((_, i) => i !== index))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-label-sm tracking-wider text-on-surface-variant uppercase">
              <th className="p-md font-medium">Libellé / Catalogue</th>
              <th className="w-24 p-md text-center font-medium">Qté</th>
              <th className="w-28 p-md font-medium">Unité</th>
              <th className="w-32 p-md font-medium">PU HT</th>
              <th className="w-24 p-md font-medium">TVA</th>
              <th className="w-20 p-md text-center font-medium">Remise</th>
              <th className="w-32 p-md text-right font-medium">Total HT</th>
              <th className="w-12 p-md"></th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-lg text-center text-body-md text-on-surface-variant"
                >
                  Aucune ligne. Ajoutez une prestation ci-dessous.
                </td>
              </tr>
            )}
            {lignes.map((ligne, i) => (
              <tr
                key={i}
                className="border-b border-outline-variant transition-colors last:border-0 hover:bg-surface-container-low"
              >
                <td className="p-md">
                  <input
                    className={cellInput}
                    placeholder="Libellé de la prestation"
                    disabled={verrouille}
                    value={ligne.libelle}
                    onChange={(e) => modifier(i, 'libelle', e.target.value)}
                  />
                </td>
                <td className="p-md">
                  <input
                    className={`${cellInput} text-center`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    disabled={verrouille}
                    value={ligne.quantite}
                    onChange={(e) =>
                      modifier(i, 'quantite', Number(e.target.value) || 0)
                    }
                  />
                </td>
                <td className="p-md">
                  <select
                    className={cellInput}
                    disabled={verrouille}
                    value={ligne.unite}
                    onChange={(e) =>
                      modifier(i, 'unite', e.target.value as Unite)
                    }
                  >
                    {UNITES.map((u) => (
                      <option key={u} value={u}>
                        {libelleUnite[u]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-md">
                  <input
                    className={cellInput}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    disabled={verrouille}
                    value={ligne.prixUnitaireHT}
                    onChange={(e) =>
                      modifier(i, 'prixUnitaireHT', Number(e.target.value) || 0)
                    }
                  />
                </td>
                <td className="p-md">
                  <select
                    className={cellInput}
                    disabled={verrouille}
                    value={ligne.tauxTva}
                    onChange={(e) =>
                      modifier(i, 'tauxTva', Number(e.target.value))
                    }
                  >
                    {TAUX_TVA.map((t) => (
                      <option key={t} value={t}>
                        {t}%
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-md">
                  <input
                    className={`${cellInput} text-center`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    disabled={verrouille}
                    value={ligne.remisePourcent ?? 0}
                    onChange={(e) =>
                      modifier(i, 'remisePourcent', Number(e.target.value) || 0)
                    }
                  />
                </td>
                <td className="p-md text-right font-bold text-on-surface">
                  {formatEuro(totalLigneHT(ligne))}
                </td>
                <td className="p-md text-center">
                  {!verrouille && (
                    <button
                      type="button"
                      onClick={() => supprimer(i)}
                      className="text-error transition-transform hover:scale-110"
                      aria-label="Supprimer la ligne"
                    >
                      <Icone nom="poubelle" className="size-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!verrouille && (
        <div className="flex flex-col gap-sm p-md sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onChange([...lignes, ligneVide()])}
            className="flex items-center gap-xs rounded-lg px-md py-sm text-label-md font-bold text-primary transition-colors hover:bg-primary-container/10"
          >
            <Icone nom="plus-cercle" className="size-5" />
            Ajouter une ligne
          </button>
          {catalogue.length > 0 && (
            <select
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-label-md text-on-surface-variant outline-none focus:border-primary sm:ml-auto"
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
        </div>
      )}
    </div>
  )
}
