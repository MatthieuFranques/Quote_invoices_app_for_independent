import PageEntete from '../components/PageEntete'

/** Liste des devis / factures avec recherche et filtres (à venir). */
export default function Documents() {
  return (
    <div>
      <PageEntete titre="Documents" />
      <p className="p-4 text-gray-600">Devis et factures à venir.</p>
    </div>
  )
}
