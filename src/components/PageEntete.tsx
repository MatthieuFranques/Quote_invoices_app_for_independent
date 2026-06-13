import type { ReactNode } from 'react'

/** En-tête de page : titre + sous-titre à gauche, actions à droite. */
export default function PageEntete({
  titre,
  sousTitre,
  actions,
}: {
  titre: string
  sousTitre?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-center">
      <div>
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
          {titre}
        </h1>
        {sousTitre && (
          <p className="text-body-md text-on-surface-variant">{sousTitre}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

/** Conteneur de page : largeur max + marges responsives. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="px-margin-mobile py-lg md:px-margin-desktop">
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </div>
  )
}
