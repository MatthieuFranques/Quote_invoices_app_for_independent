import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icone, { type NomIcone } from '../components/Icone'

const onglets: { to: string; label: string; icone: NomIcone; exact?: boolean }[] =
  [
    { to: '/', label: 'Tableau de bord', icone: 'dashboard', exact: true },
    { to: '/clients', label: 'Clients', icone: 'clients' },
    { to: '/catalogue', label: 'Catalogue', icone: 'catalogue' },
    { to: '/parametres', label: 'Paramètres', icone: 'parametres' },
  ]

/**
 * Coquille de l'application. Desktop : barre latérale fixe 280px. Mobile :
 * top-bar + barre de navigation basse (ergonomie pouce). Conforme aux maquettes
 * FactureLocale.
 */
export default function Layout() {
  const navigate = useNavigate()
  const nouveauDevis = () => navigate('/documents/nouveau?type=devis')

  return (
    <div className="min-h-full bg-surface text-on-surface">
      {/* Barre latérale — desktop */}
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-[280px] flex-col gap-md border-r border-outline-variant bg-surface-container-low p-lg md:flex">
        <div className="mb-xl">
          <h1 className="text-headline-lg font-bold text-primary">
            FactureLocale
          </h1>
          <p className="text-label-md text-on-surface-variant">Indépendant</p>
        </div>

        <nav className="flex flex-grow flex-col gap-xs">
          {onglets.map((o) => (
            <NavLink
              key={o.to}
              to={o.to}
              end={o.exact}
              className={({ isActive }) =>
                [
                  'flex items-center gap-md rounded-xl px-md py-sm transition-colors',
                  isActive
                    ? 'bg-primary-container font-bold text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-variant',
                ].join(' ')
              }
            >
              <Icone nom={o.icone} className="size-5" />
              <span className="text-label-md">{o.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={nouveauDevis}
          className="flex h-[56px] w-full items-center justify-center gap-xs rounded-xl bg-primary text-label-md font-bold text-on-primary transition-all hover:opacity-90 active:scale-95"
        >
          <Icone nom="plus" className="size-5" />
          Nouveau Document
        </button>

        <div className="mt-auto flex items-center gap-sm border-t border-outline-variant pt-md">
          <Icone nom="horsligne" className="size-5 shrink-0 text-primary" />
          <span className="text-label-sm leading-tight text-on-surface-variant">
            Données stockées localement sur cet appareil
          </span>
        </div>
      </aside>

      {/* Top-bar — mobile */}
      <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:hidden">
        <span className="text-headline-lg-mobile font-bold text-primary">
          FactureLocale
        </span>
        <Icone nom="compte" className="size-7 text-primary" />
      </header>

      {/* Contenu */}
      <main className="pb-[100px] md:ml-[280px] md:pb-lg">
        <Outlet />
      </main>

      {/* Bouton flottant — mobile */}
      <button
        type="button"
        onClick={nouveauDevis}
        aria-label="Nouveau devis"
        className="fixed right-margin-mobile bottom-[80px] z-40 flex size-[56px] items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all active:scale-90 md:hidden"
      >
        <Icone nom="plus" className="size-8" />
      </button>

      {/* Navigation basse — mobile */}
      <nav className="pb-safe fixed bottom-0 left-0 z-50 flex h-[64px] w-full items-center justify-around border-t border-outline-variant bg-surface px-xs shadow-lg md:hidden">
        {onglets.map((o) => (
          <NavLink
            key={o.to}
            to={o.to}
            end={o.exact}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1 transition-all',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant',
              ].join(' ')
            }
          >
            <Icone nom={o.icone} className="size-5" />
            <span className="text-label-sm">{o.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
