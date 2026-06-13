import { useEffect, useRef, useState } from 'react'
import PageEntete, { Page } from '../components/PageEntete'
import { ChampTexte, ChampZone, Interrupteur, Section } from '../components/champs'
import { db, getParametres } from '../db/db'
import type { ParametresEntreprise } from '../db/types'
import {
  FichierInvalideError,
  importerDepuisFichier,
  importerDocumentsDepuisFichier,
  telechargerDocuments,
  telechargerSauvegarde,
} from '../db/sauvegarde'
import { fichierVersDataUrl } from '../lib/image'

export default function Parametres() {
  const [form, setForm] = useState<ParametresEntreprise | null>(null)
  const [enregistre, setEnregistre] = useState(false)
  const fichierRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const docsRef = useRef<HTMLInputElement>(null)

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

  async function choisirLogo(fichier: File) {
    try {
      set('logo', await fichierVersDataUrl(fichier))
    } catch {
      window.alert('Image illisible.')
    }
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

  async function importerDocs(fichier: File) {
    try {
      const n = await importerDocumentsDepuisFichier(fichier)
      window.alert(`${n} document(s) importé(s) et ajouté(s).`)
    } catch (e) {
      const msg =
        e instanceof FichierInvalideError ? e.message : 'Échec de l’import.'
      window.alert(msg)
    }
  }

  if (!form) {
    return (
      <Page>
        <PageEntete titre="Paramètres" />
        <p className="text-on-surface-variant">Chargement…</p>
      </Page>
    )
  }

  return (
    <Page>
      <PageEntete
        titre="Paramètres"
        sousTitre="Identité, mentions légales, numérotation et sauvegarde."
        actions={
          <button
            type="button"
            onClick={enregistrer}
            className="h-[48px] rounded-xl bg-primary px-lg text-label-md font-bold text-on-primary transition-all hover:opacity-90 active:scale-95"
          >
            {enregistre ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
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

        <Section titre="Logo">
          <div className="flex items-center gap-lg">
            {form.logo ? (
              <img
                src={form.logo}
                alt="Logo"
                className="size-20 rounded-lg border border-outline-variant object-contain"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-lg border border-dashed border-outline-variant text-label-sm text-on-surface-variant">
                Aucun logo
              </div>
            )}
            <div className="flex flex-col gap-sm">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface"
              >
                {form.logo ? 'Changer' : 'Ajouter un logo'}
              </button>
              {form.logo && (
                <button
                  type="button"
                  onClick={() => set('logo', undefined)}
                  className="text-label-md font-semibold text-error"
                >
                  Retirer
                </button>
              )}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) choisirLogo(f)
                e.target.value = ''
              }}
            />
          </div>
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
          <p className="text-label-sm text-on-surface-variant">
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
          <p className="text-label-sm text-on-surface-variant">
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

        <Section titre="Documents (JSON)">
          <p className="text-label-sm text-on-surface-variant">
            Exportez vos devis / factures dans un fichier JSON, ou importez-en
            depuis un autre appareil. L'import <strong>ajoute</strong> les
            documents sans effacer les existants.
          </p>
          <div className="flex flex-col gap-sm">
            <button
              type="button"
              onClick={telechargerDocuments}
              className="rounded-lg border border-primary px-lg py-sm font-bold text-primary"
            >
              Exporter les documents (JSON)
            </button>
            <button
              type="button"
              onClick={() => docsRef.current?.click()}
              className="rounded-lg border border-outline-variant px-lg py-sm font-bold text-on-surface"
            >
              Importer des documents
            </button>
            <input
              ref={docsRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importerDocs(f)
                e.target.value = ''
              }}
            />
          </div>
        </Section>

        <Section titre="Sauvegarde">
          <p className="text-label-sm text-on-surface-variant">
            Exportez toutes vos données dans un fichier pour les sauvegarder ou
            changer d’appareil.
          </p>
          <div className="flex flex-col gap-sm">
            <button
              type="button"
              onClick={telechargerSauvegarde}
              className="rounded-lg border border-primary px-lg py-sm font-bold text-primary"
            >
              Exporter mes données (JSON)
            </button>
            <button
              type="button"
              onClick={() => fichierRef.current?.click()}
              className="rounded-lg border border-outline-variant px-lg py-sm font-bold text-on-surface"
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
    </Page>
  )
}
