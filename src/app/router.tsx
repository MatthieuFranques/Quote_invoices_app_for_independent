import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import Accueil from '../pages/Accueil'
import Documents from '../pages/Documents'
import Clients from '../pages/Clients'
import Catalogue from '../pages/Catalogue'
import Parametres from '../pages/Parametres'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Accueil /> },
      { path: 'documents', element: <Documents /> },
      { path: 'clients', element: <Clients /> },
      { path: 'catalogue', element: <Catalogue /> },
      { path: 'parametres', element: <Parametres /> },
    ],
  },
])
