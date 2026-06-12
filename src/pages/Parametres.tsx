import { useEffect, useRef, useState } from 'react'
import PageEntete from '../components/PageEntete'
import { ChampTexte, ChampZone, Interrupteur, Section } from '../components/champs'
import { db, getParametres } from '../db/db'
import type { ParametresEntreprise } from '../db/types'
import {
  FichierInvalideError,
  importerDepuisFichier,
  telechargerSauvegarde,
} from '../db/sauvegarde'

export default function Parametres() {
  const [form, setForm] = useState<ParametresEntreprise | null>(null)
  const [enregistre, setEnregistre] = useState(false)
  const fichierRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getParametres().then(setForm)
  }, [])

  function set<K extends keyof ParametresEntreprise>(
    cle: K,
    valeur: ParametresEntreprise[K],
  ) {
    setForm((f) => (f ? { ...f, [cle]: valeur } : f))
    setEnregistre(false)
  }

  async function enregistrer() {
    if (!form) return
    await db.parametres.put(form)
    setEnregistre(true)
  }

  async function importer(fichier: File) {
    const ok = window.confirm(
      'Importer remplacera TOUTES les données actuelles (clients, documents, réglages). Continuer ?',
    )
    if (!ok) return
    try {
      await importerDepuisFichier(fichier)
      setForm(await getParametres())
      window.alert('Sauvegarde importée.')
    } catch (e) {
      const msg =
        e instanceof FichierInvalideError ? e.message : 'Échec de l’import.'
      window.alert(msg)
    }
  }

  if (!form) {
    return (
      <div>
        <PageEntete titre="Réglages" />
        <p className="p-4 text-gray-600">Chargement…</p>
      </div>
    )
  }

  return (
    <div>
      <PageEntete
        titre="Réglages"
        actions={
          <button
            type="button"
            onClick={enregistrer}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {enregistre ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        }
      />

      <div className="space-y-8 p-4">
        <Section titre="Identité">
          <ChampTexte
            label="Nom / raison sociale"
            valeur={form.nom}
            onChange={(v) => set('nom', v)}
          />
          <ChampZone
            label="Adresse"
            valeur={form.adresse}
            onChange={(v) => set('adresse', v)}
            rows={2}
          />
          <ChampTexte
            label="SIRET"
            valeur={form.siret}
            onChange={(v) => set('siret', v)}
            inputMode="numeric"
          />
          <ChampTexte
            label="Téléphone"
            valeur={form.telephone}
            onChange={(v) => set('telephone', v)}
            type="tel"
            inputMode="tel"
          />
          <ChampTexte
            label="Email"
            valeur={form.email}
            onChange={(v) => set('email', v)}
            type="email"
            inputMode="email"
          />
        </Section>

        <Section titre="Mentions légales">
          <Interrupteur
            label="TVA applicable"
            valeur={form.tvaApplicable}
            onChange={(v) => set('tvaApplicable', v)}
          />
          {!form.tvaApplicable && (
            <ChampTexte
              label="Mention de franchise de TVA"
              valeur={form.mentionTva}
              onChange={(v) => set('mentionTva', v)}
            />
          )}
          <ChampZone
            label="Conditions de paiement"
            valeur={form.conditionsPaiement}
            onChange={(v) => set('conditionsPaiement', v)}
            rows={2}
          />
          <ChampZone
            label="Pénalités de retard"
            valeur={form.penalitesRetard}
            onChange={(v) => set('penalitesRetard', v)}
            rows={2}
          />
          <ChampTexte
            label="IBAN"
            valeur={form.iban}
            onChange={(v) => set('iban', v)}
          />
        </Section>

        <Section titre="Numérotation">
          <ChampTexte
            label="Préfixe devis"
            valeur={form.prefixeDevis}
            onChange={(v) => set('prefixeDevis', v)}
          />
          <ChampTexte
            label="Préfixe facture"
            valeur={form.prefixeFacture}
            onChange={(v) => set('prefixeFacture', v)}
          />
          <ChampTexte
            label="Préfixe avoir"
            valeur={form.prefixeAvoir}
            onChange={(v) => set('prefixeAvoir', v)}
          />
          <p className="text-xs text-gray-500">
            Les numéros sont attribués automatiquement et séquentiellement à
            l’émission (obligation légale : sans trou).
          </p>
        </Section>

        <Section titre="Email d’envoi">
          <ChampTexte
            label="Objet"
            valeur={form.emailObjet}
            onChange={(v) => set('emailObjet', v)}
          />
          <ChampZone
            label="Corps du message"
            valeur={form.emailCorps}
            onChange={(v) => set('emailCorps', v)}
            rows={4}
          />
          <p className="text-xs text-gray-500">
            Variables disponibles : {'{type}'}, {'{numero}'}, {'{entreprise}'}.
          </p>
        </Section>

        <Section titre="Apparence des PDF">
          <ChampTexte
            label="Couleur d’accent"
            valeur={form.couleurAccent}
            onChange={(v) => set('couleurAccent', v)}
            type="color"
          />
        </Section>

        <Section titre="Sauvegarde">
          <p className="text-xs text-gray-500">
            Exportez toutes vos données dans un fichier pour les sauvegarder ou
            changer d’appareil.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={telechargerSauvegarde}
              className="rounded-lg border border-blue-700 px-4 py-3 font-semibold text-blue-700"
            >
              Exporter mes données (JSON)
            </button>
            <button
              type="button"
              onClick={() => fichierRef.current?.click()}
              className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700"
            >
              Importer une sauvegarde
            </button>
            <input
              ref={fichierRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importer(f)
                e.target.value = ''
              }}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}
