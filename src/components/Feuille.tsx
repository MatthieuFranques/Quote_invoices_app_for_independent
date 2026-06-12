import type { ReactNode } from 'react'
import { useEffect } from 'react'

/**
 * Feuille modale glissant depuis le bas (bottom sheet). Ergonomie mobile :
 * formulaires de création / édition par-dessus la liste.
 */
export default function Feuille({
  ouverte,
  titre,
  onFermer,
  children,
}: {
  ouverte: boolean
  titre: string
  onFermer: () => void
  children: ReactNode
}) {
  // Fermeture à la touche Échap.
  useEffect(() => {
    if (!ouverte) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ouverte, onFermer])

  if (!ouverte) return null

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40">
      <button
        type="button"
        aria-label="Fermer"
        className="flex-1"
        onClick={onFermer}
      />
      <div className="max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white">
        <header className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">{titre}</h2>
          <button
            type="button"
            onClick={onFermer}
            className="text-2xl leading-none text-gray-400"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
