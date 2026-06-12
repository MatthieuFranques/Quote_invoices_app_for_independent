import { NavLink, Outlet } from 'react-router-dom'

/** Onglets de navigation, affichés en bas (ergonomie pouce sur mobile). */
const onglets = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/documents', label: 'Documents' },
  { to: '/clients', label: 'Clients' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/parametres', label: 'Réglages' },
]

/**
 * Coquille de l'application : zone de contenu défilante + barre d'onglets fixe
 * en bas. Mobile-first, gros boutons.
 */
export default function Layout() {
  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {onglets.map((o) => (
          <NavLink
            key={o.to}
            to={o.to}
            end={o.exact}
            className={({ isActive }) =>
              [
                'flex min-h-16 flex-col items-center justify-center gap-1 text-xs',
                isActive ? 'font-semibold text-blue-700' : 'text-gray-500',
              ].join(' ')
            }
          >
            {o.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
