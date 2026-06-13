import { pdf } from '@react-pdf/renderer'
import type {
  Client,
  Document,
  ParametresEntreprise,
} from '../db/types'
import { labelType } from '../lib/document'
import { DocumentPDF } from './DocumentPDF'

/** Génère le PDF du document sous forme de Blob. */
export function genererPdfBlob(
  doc: Document,
  params: ParametresEntreprise,
  client?: Client,
): Promise<Blob> {
  return pdf(
    <DocumentPDF doc={doc} params={params} client={client} />,
  ).toBlob()
}

/** Nom de fichier propre pour le PDF (ex : FAC-2026-001.pdf). */
export function nomFichierPdf(doc: Document): string {
  const base = doc.numero ?? labelType[doc.type]
  return `${base}.pdf`.replace(/\s+/g, '-')
}

/** Génère puis télécharge le PDF. */
export async function telechargerPdf(
  doc: Document,
  params: ParametresEntreprise,
  client?: Client,
): Promise<void> {
  const blob = await genererPdfBlob(doc, params, client)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichierPdf(doc)
  a.click()
  URL.revokeObjectURL(url)
}
