// @ts-check
// Captures d'écran de revue visuelle, en bureau (1440 x 900) et en mobile (iPhone 13).
// Usage : node scripts/capturer.mjs <origine> <dossier> [chemin ...]
//   exemple : node scripts/capturer.mjs http://127.0.0.1:3000 docs/captures/socle / /demande
// Pour chaque chemin : l'écran visible et la page entière, dans les deux formats.
// Toute erreur de console ou ressource en échec est signalée (code de sortie 1).
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, devices } from '@playwright/test'

const LARGEUR_BUREAU = 1440
const HAUTEUR_BUREAU = 900
const STATUT_ERREUR = 400

const [origine = 'http://127.0.0.1:3000', dossier = 'docs/captures', ...demandes] =
  process.argv.slice(2)
const chemins = demandes.length > 0 ? demandes : ['/']

const formats = [
  {
    nom: 'bureau-1440x900',
    options: { viewport: { width: LARGEUR_BUREAU, height: HAUTEUR_BUREAU } },
  },
  { nom: 'mobile-iphone13', options: { ...devices['iPhone 13'] } },
]

/** @param {string} chemin */
function nomDeFichier(chemin) {
  const nom = chemin.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9-]+/gi, '-')
  return nom === '' ? 'accueil' : nom
}

mkdirSync(dossier, { recursive: true })
const navigateur = await chromium.launch()
/** @type {string[]} */
const problemes = []
try {
  for (const format of formats) {
    const contexte = await navigateur.newContext(format.options)
    const page = await contexte.newPage()
    // Le statut de la page elle-même est voulu (une page 404 se capture aussi) :
    // seuls comptent les ressources en échec et les erreurs de script.
    page.on('console', (message) => {
      if (message.type() === 'error' && message.location().url !== page.url()) {
        problemes.push(`${format.nom} console : ${message.text()}`)
      }
    })
    page.on('pageerror', (erreur) => problemes.push(`${format.nom} script : ${erreur.message}`))
    page.on('response', (reponse) => {
      const estLaPage = reponse.request().resourceType() === 'document'
      if (!estLaPage && reponse.status() >= STATUT_ERREUR) {
        problemes.push(`${format.nom} ${reponse.status()} : ${reponse.url()}`)
      }
    })
    for (const chemin of chemins) {
      await page.goto(new URL(chemin, origine).href, { waitUntil: 'networkidle' })
      await page.evaluate('document.fonts.ready.then(() => true)')
      const base = join(dossier, `${nomDeFichier(chemin)}-${format.nom}`)
      await page.screenshot({ path: `${base}.png` })
      await page.screenshot({ path: `${base}-page-entiere.png`, fullPage: true })
      console.log(`Capturé : ${base}.png et ${base}-page-entiere.png`)
    }
    await contexte.close()
  }
} finally {
  await navigateur.close()
}
if (problemes.length > 0) {
  console.error(`Problèmes relevés pendant les captures :\n${problemes.join('\n')}`)
  process.exit(1)
}
