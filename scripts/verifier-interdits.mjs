// @ts-check
// Porte bloquante : caractères et styles interdits par la charte du projet.
//  - tirets cadratin et demi-cadratin, partout (marque d'écriture automatique) ;
//  - emoji et pictogrammes dans le code, les fichiers publics et les données ;
//  - ombres et halos dans les feuilles de style ;
//  - texte SVG dans les fichiers publics (un logo se trace en chemins).
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'

// Construits par leur point de code : ce fichier ne doit pas contenir ce qu'il interdit.
const TIRET_CADRATIN = String.fromCodePoint(0x2014)
const TIRET_DEMI_CADRATIN = String.fromCodePoint(0x2013)
/** Signes typographiques classés pictographiques par Unicode mais légitimes dans un texte. */
const SIGNES_TYPOGRAPHIQUES = new Set(
  [0xa9, 0xae, 0x2122].map((code) => String.fromCodePoint(code)),
)
const PICTOGRAMME = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}]/gu

const CHEMINS_EXCLUS = ['docs/recherche/captures/', 'docs/jury/']
const DOSSIERS_SANS_EMOJI = ['src/', 'public/', 'donnees/']
const DOSSIERS_DU_SITE = ['src/', 'public/']
const EXTENSIONS_BINAIRES = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.pdf',
  '.zip',
  '.sqlite',
])
const OCTETS_SONDES = 8000

const DECLARATION_BOX_SHADOW = /box-shadow\s*:\s*([^;}]*)/gi
const DECLARATION_TEXT_SHADOW = /text-shadow\s*:/i
const FILTRE_DROP_SHADOW = /drop-shadow\s*\(/i
const ELEMENT_TEXTE_SVG = /<text[\s>/]/i

/** @typedef {{ fichier: string, ligne: number, motif: string }} Faute */

/**
 * Analyse le contenu d'un fichier. Fonction pure, testée à part.
 * @param {string} chemin chemin relatif à la racine, séparateurs « / »
 * @param {string} contenu
 * @returns {Faute[]}
 */
export function analyserContenu(chemin, contenu) {
  /** @type {Faute[]} */
  const fautes = []
  const extension = extname(chemin).toLowerCase()
  const dansLeSite = DOSSIERS_DU_SITE.some((dossier) => chemin.startsWith(dossier))
  const sansEmoji = DOSSIERS_SANS_EMOJI.some((dossier) => chemin.startsWith(dossier))
  const estCss = extension === '.css' && dansLeSite
  const estSvgPublic = extension === '.svg' && chemin.startsWith('public/')

  contenu.split('\n').forEach((texte, index) => {
    const signaler = (/** @type {string} */ motif) =>
      fautes.push({ fichier: chemin, ligne: index + 1, motif })
    if (texte.includes(TIRET_CADRATIN)) signaler('tiret cadratin (U+2014) interdit')
    if (texte.includes(TIRET_DEMI_CADRATIN)) signaler('tiret demi-cadratin (U+2013) interdit')
    if (sansEmoji) {
      for (const [caractere] of texte.matchAll(PICTOGRAMME)) {
        if (SIGNES_TYPOGRAPHIQUES.has(caractere)) continue
        const code = caractere.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')
        signaler(`emoji ou pictogramme (U+${code}) interdit`)
      }
    }
    if (estCss) {
      for (const [, valeur = ''] of texte.matchAll(DECLARATION_BOX_SHADOW)) {
        if (valeur.replace(/!important/i, '').trim() !== 'none') {
          signaler(
            `box-shadow « ${valeur.trim()} » interdit (ni ombre ni halo, seul none est admis)`,
          )
        }
      }
      if (DECLARATION_TEXT_SHADOW.test(texte)) signaler('text-shadow interdit')
      if (FILTRE_DROP_SHADOW.test(texte)) signaler('filtre drop-shadow interdit (halo)')
    }
    if (estSvgPublic && ELEMENT_TEXTE_SVG.test(texte)) {
      signaler('élément <text> interdit dans un SVG public (tracer les lettres en chemins)')
    }
  })
  return fautes
}

/**
 * Fichiers suivis par git, ou nouveaux et non ignorés : exactement ce qui
 * entrerait dans un commit.
 * @param {string} racine
 * @returns {string[]}
 */
export function listerFichiers(racine) {
  const sortie = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: racine, encoding: 'utf8' },
  )
  return sortie
    .split('\0')
    .filter((chemin) => chemin !== '')
    .filter((chemin) => !CHEMINS_EXCLUS.some((exclu) => chemin.startsWith(exclu)))
    .filter((chemin) => !EXTENSIONS_BINAIRES.has(extname(chemin).toLowerCase()))
}

/**
 * @param {string} racine
 * @returns {{ fautes: Faute[], controles: number }}
 */
export function verifier(racine) {
  /** @type {Faute[]} */
  const fautes = []
  let controles = 0
  for (const chemin of listerFichiers(racine)) {
    /** @type {Buffer} */
    let octets
    try {
      octets = readFileSync(`${racine}/${chemin}`)
    } catch {
      continue // suivi par git mais supprimé de la copie de travail
    }
    if (octets.subarray(0, OCTETS_SONDES).includes(0)) continue // binaire
    controles += 1
    fautes.push(...analyserContenu(chemin, octets.toString('utf8')))
  }
  return { fautes, controles }
}

function principal() {
  const { fautes, controles } = verifier(process.cwd())
  if (controles === 0) {
    console.error(
      'Aucun fichier contrôlé : la vérification ne s’exécute pas. Lancer depuis la racine du dépôt.',
    )
    process.exit(1)
  }
  if (fautes.length > 0) {
    console.error(`${fautes.length} interdit(s) trouvé(s) :`)
    for (const faute of fautes) console.error(`  ${faute.fichier}:${faute.ligne} : ${faute.motif}`)
    process.exit(1)
  }
  console.log(`Aucun caractère ni style interdit (${controles} fichiers contrôlés).`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal()
