import {
  Document as PdfDocument,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type {
  Client,
  Document,
  ParametresEntreprise,
} from '../db/types'
import { calculerTotaux, totalLigneHT } from '../db/calculs'
import { formatDate, formatEuro, libelleUnite } from '../lib/format'
import { labelType } from '../lib/document'

/** Résout les infos émetteur : snapshot figé si émis, sinon paramètres actuels. */
function resoudreEmetteur(doc: Document, params: ParametresEntreprise) {
  return (
    doc.emetteurSnapshot ?? {
      nom: params.nom,
      adresse: params.adresse,
      siret: params.siret,
      email: params.email,
      telephone: params.telephone,
      mentionTva: params.tvaApplicable ? '' : params.mentionTva,
      conditionsPaiement: params.conditionsPaiement,
      penalitesRetard: params.penalitesRetard,
      iban: params.iban,
    }
  )
}

/** Résout les infos client : snapshot figé si émis, sinon fiche client. */
function resoudreClient(doc: Document, client?: Client) {
  if (doc.clientSnapshot) return doc.clientSnapshot
  if (!client) return null
  return {
    type: client.type,
    nom: client.nom,
    adresse: client.adresse,
    email: client.email,
    telephone: client.telephone,
    siret: client.siret,
  }
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: '#1f2937', fontFamily: 'Helvetica' },
  entete: { flexDirection: 'row', justifyContent: 'space-between' },
  logo: { width: 80, height: 80, objectFit: 'contain', marginBottom: 8 },
  emetteurNom: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  titreBloc: { alignItems: 'flex-end' },
  titre: { fontSize: 20, fontFamily: 'Helvetica-Bold' },
  numero: { marginTop: 4, fontSize: 11 },
  ligneInfo: { color: '#4b5563' },
  destinataire: {
    marginTop: 24,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    maxWidth: 260,
  },
  sousTitre: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nomGras: { fontFamily: 'Helvetica-Bold' },
  table: { marginTop: 20 },
  trEntete: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#111827',
    paddingBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 5,
  },
  cDesignation: { flex: 1 },
  cQte: { width: 60, textAlign: 'right' },
  cPu: { width: 70, textAlign: 'right' },
  cTva: { width: 45, textAlign: 'right' },
  cTotal: { width: 70, textAlign: 'right' },
  totaux: { marginTop: 14, alignSelf: 'flex-end', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalTtc: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#111827',
    marginTop: 3,
    paddingTop: 4,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  pied: {
    marginTop: 28,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    color: '#4b5563',
    fontSize: 8,
  },
  piedLigne: { marginBottom: 3 },
})

/** Document PDF d'un devis / facture (modèle classique). */
export function DocumentPDF({
  doc,
  params,
  client,
}: {
  doc: Document
  params: ParametresEntreprise
  client?: Client
}) {
  const e = resoudreEmetteur(doc, params)
  const c = resoudreClient(doc, client)
  const totaux = calculerTotaux(doc)
  const accent = params.couleurAccent || '#1d4ed8'
  const dateEcheance =
    doc.type === 'devis' ? doc.dateValidite : doc.dateEcheance
  const labelEcheance =
    doc.type === 'devis' ? 'Valable jusqu’au' : 'Échéance'

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.entete}>
          <View>
            {params.logo ? <Image src={params.logo} style={styles.logo} /> : null}
            <Text style={styles.emetteurNom}>{e.nom || 'Votre entreprise'}</Text>
            {e.adresse ? <Text style={styles.ligneInfo}>{e.adresse}</Text> : null}
            {e.siret ? (
              <Text style={styles.ligneInfo}>SIRET : {e.siret}</Text>
            ) : null}
            {e.telephone ? (
              <Text style={styles.ligneInfo}>{e.telephone}</Text>
            ) : null}
            {e.email ? <Text style={styles.ligneInfo}>{e.email}</Text> : null}
          </View>
          <View style={styles.titreBloc}>
            <Text style={{ ...styles.titre, color: accent }}>
              {labelType[doc.type].toUpperCase()}
            </Text>
            {doc.numero ? (
              <Text style={styles.numero}>{doc.numero}</Text>
            ) : null}
            <Text style={styles.ligneInfo}>
              Date : {formatDate(doc.dateEmission ?? doc.dateCreation)}
            </Text>
            {dateEcheance ? (
              <Text style={styles.ligneInfo}>
                {labelEcheance} : {formatDate(dateEcheance)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.destinataire}>
          <Text style={styles.sousTitre}>Destinataire</Text>
          {c ? (
            <>
              <Text style={styles.nomGras}>{c.nom}</Text>
              {c.adresse ? <Text>{c.adresse}</Text> : null}
              {c.siret ? <Text>SIRET : {c.siret}</Text> : null}
              {c.email ? <Text>{c.email}</Text> : null}
            </>
          ) : (
            <Text>Aucun client</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.trEntete}>
            <Text style={styles.cDesignation}>Désignation</Text>
            <Text style={styles.cQte}>Qté</Text>
            <Text style={styles.cPu}>PU HT</Text>
            <Text style={styles.cTva}>TVA</Text>
            <Text style={styles.cTotal}>Total HT</Text>
          </View>
          {doc.lignes.map((l, i) => (
            <View key={i} style={styles.tr}>
              <Text style={styles.cDesignation}>{l.libelle}</Text>
              <Text style={styles.cQte}>
                {l.quantite} {libelleUnite[l.unite]}
              </Text>
              <Text style={styles.cPu}>{formatEuro(l.prixUnitaireHT)}</Text>
              <Text style={styles.cTva}>{l.tauxTva} %</Text>
              <Text style={styles.cTotal}>{formatEuro(totalLigneHT(l))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totaux}>
          {doc.remiseGlobalePourcent ? (
            <View style={styles.totalRow}>
              <Text>Remise globale</Text>
              <Text>{doc.remiseGlobalePourcent} %</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>Total HT</Text>
            <Text>{formatEuro(totaux.totalHT)}</Text>
          </View>
          {Object.entries(totaux.tvaParTaux).map(([taux, montant]) => (
            <View key={taux} style={styles.totalRow}>
              <Text>TVA {taux} %</Text>
              <Text>{formatEuro(montant)}</Text>
            </View>
          ))}
          <View style={styles.totalTtc}>
            <Text>Total TTC</Text>
            <Text>{formatEuro(totaux.totalTTC)}</Text>
          </View>
          {doc.type === 'facture' && (doc.acompte ?? 0) > 0 ? (
            <>
              <View style={styles.totalRow}>
                <Text>Acompte versé</Text>
                <Text>- {formatEuro(doc.acompte ?? 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.nomGras}>Net à payer</Text>
                <Text style={styles.nomGras}>
                  {formatEuro(totaux.totalTTC - (doc.acompte ?? 0))}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.pied}>
          {e.mentionTva ? (
            <Text style={styles.piedLigne}>{e.mentionTva}</Text>
          ) : null}
          {e.conditionsPaiement ? (
            <Text style={styles.piedLigne}>{e.conditionsPaiement}</Text>
          ) : null}
          {e.penalitesRetard ? (
            <Text style={styles.piedLigne}>{e.penalitesRetard}</Text>
          ) : null}
          {e.iban ? (
            <Text style={styles.piedLigne}>IBAN : {e.iban}</Text>
          ) : null}
          {doc.notes ? (
            <Text style={styles.piedLigne}>{doc.notes}</Text>
          ) : null}
        </View>
      </Page>
    </PdfDocument>
  )
}
