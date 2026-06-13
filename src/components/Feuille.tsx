import type { ReactNode } from 'react'
import { useEffect } from 'react'

/**
 * Feuille modale. Mobile : glisse depuis le bas (bottom sheet). Desktop :
 * panneau centré. Sert aux formulaires de création / édition.
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
  useEffect(() => {
    if (!ouverte) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ouverte, onFermer])

  if (!ouverte) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 md:items-center md:justify-center md:p-lg">
      <button
        type="button"
        aria-label="Fermer"
        className="flex-1 md:hidden"
        onClick={onFermer}
      />
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-surface-container-lowest md:max-w-[520px] md:rounded-xl md:shadow-xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-lg py-md">
          <h2 className="text-headline-sm">{titre}</h2>
          <button
            type="button"
            onClick={onFermer}
            className="text-2xl leading-none text-on-surface-variant hover:text-on-surface"
            aria-label="Fermer"
          >
            ×
          </button>
        </header>
        <div className="p-lg">{children}</div>
      </div>
    </div>
  )
}
