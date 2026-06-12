import type { ReactNode } from 'react'

/** En-tête de page : titre collant en haut + actions optionnelles à droite. */
export default function PageEntete({
  titre,
  actions,
}: {
  titre: string
  actions?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3">
      <h1 className="text-lg font-bold text-gray-900">{titre}</h1>
      {actions}
    </header>
  )
}
