/**
 * Lit un fichier image et renvoie un data URL redimensionné (côté le plus long
 * borné à `maxCote`). Évite de stocker une image lourde dans IndexedDB / le
 * fichier de sauvegarde JSON. Encode en PNG pour préserver la transparence.
 */
export function fichierVersDataUrl(
  fichier: File,
  maxCote = 320,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const echelle = Math.min(1, maxCote / Math.max(img.width, img.height))
      const largeur = Math.round(img.width * echelle)
      const hauteur = Math.round(img.height * echelle)
      const canvas = document.createElement('canvas')
      canvas.width = largeur
      canvas.height = hauteur
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas indisponible.'))
        return
      }
      ctx.drawImage(img, 0, 0, largeur, hauteur)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible.'))
    }
    img.src = url
  })
}
