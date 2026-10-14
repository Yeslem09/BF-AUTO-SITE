// @ts-check
// Construit les ressources navigateur :
//  - scripts : chaque fichier .ts à la racine de src/web/client/ devient
//    public/js/<nom>.js, et chaque fichier .ts à la racine de
//    src/contextes/<contexte>/adaptateurs/web/client/ devient public/js/<contexte>/<nom>.js
//    (les modules importés vivent dans un sous-dossier, par exemple modules/) ;
//  - feuille de style unique public/css/bf-auto.css, dans l'ordre des couches :
//    jetons.css, site.css (base et couche commune), composants.css, accueil.css,
//    utilitaires.css, puis les styles.css de chaque contexte, par ordre alphabétique.
// Option --surveiller : reconstruit à chaque modification (développement).
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build, context } from 'esbuild'

export const RACINE = fileURLToPath(new URL('..', import.meta.url))
const DOSSIER_CLIENT_COMMUN = 'src/web/client'
const DOSSIER_CONTEXTES = 'src/contextes'
const CLIENT_DE_CONTEXTE = 'adaptateurs/web/client'
const STYLES_DE_CONTEXTE = 'adaptateurs/web/styles.css'
const SORTIE_SCRIPTS = 'public/js'
const DOSSIER_CSS = 'public/css'
const SORTIE_STYLE = 'public/css/bf-auto.css'
export const FEUILLES_COMMUNES = [
  'public/css/jetons.css',
  'public/css/site.css',
  'public/css/composants.css',
  'public/css/accueil.css',
  'public/css/utilitaires.css',
]
const CIBLE_SCRIPTS = 'es2020'
const CIBLES_STYLE = ['chrome100', 'edge100', 'firefox100', 'safari15']
/** Chemins absolus résolus par le serveur, pas par le bundler. */
const RESSOURCES_EXTERNES = ['/fonts/*', '/img/*']

/** @param {string} dossier @returns {string[]} */
function sousDossiers(dossier) {
  if (!existsSync(dossier)) return []
  return readdirSync(dossier, { withFileTypes: true })
    .filter((entree) => entree.isDirectory())
    .map((entree) => entree.name)
    .sort()
}

/** Points d'entrée d'un dossier : ses fichiers .ts de premier niveau, hors tests. @param {string} dossier */
function pointsEntreeDe(dossier) {
  if (!existsSync(dossier)) return []
  return readdirSync(dossier, { withFileTypes: true })
    .filter((entree) => entree.isFile() && entree.name.endsWith('.ts'))
    .filter((entree) => !entree.name.endsWith('.test.ts') && !entree.name.endsWith('.d.ts'))
    .map((entree) => join(dossier, entree.name))
    .sort()
}

/**
 * @param {string} racine
 * @returns {Record<string, string>} nom de sortie (sans extension) vers fichier source
 */
export function listerPointsEntree(racine) {
  /** @type {Record<string, string>} */
  const entrees = {}
  for (const fichier of pointsEntreeDe(join(racine, DOSSIER_CLIENT_COMMUN))) {
    entrees[basename(fichier, '.ts')] = fichier
  }
  for (const contexte of sousDossiers(join(racine, DOSSIER_CONTEXTES))) {
    const dossier = join(racine, DOSSIER_CONTEXTES, contexte, CLIENT_DE_CONTEXTE)
    for (const fichier of pointsEntreeDe(dossier)) {
      entrees[`${contexte}/${basename(fichier, '.ts')}`] = fichier
    }
  }
  return entrees
}

/**
 * @param {string} racine
 * @returns {string[]} feuilles à assembler, dans l'ordre, relatives à la racine
 */
export function listerFeuillesDeStyle(racine) {
  const deContextes = sousDossiers(join(racine, DOSSIER_CONTEXTES))
    .map((contexte) => join(DOSSIER_CONTEXTES, contexte, STYLES_DE_CONTEXTE))
    .filter((fichier) => existsSync(join(racine, fichier)))
  return [...FEUILLES_COMMUNES, ...deContextes]
}

/** Chemin d'import CSS depuis public/css : toujours explicitement relatif. @param {string} feuille */
function importRelatif(feuille) {
  const chemin = relative(DOSSIER_CSS, feuille).split('\\').join('/')
  return chemin.startsWith('.') ? chemin : `./${chemin}`
}

/**
 * @param {{ racine?: string, surveiller?: boolean }} [options]
 */
export async function construire({ racine = RACINE, surveiller = false } = {}) {
  const entrees = listerPointsEntree(racine)
  const feuilles = listerFeuillesDeStyle(racine)
  rmSync(join(racine, SORTIE_SCRIPTS), { recursive: true, force: true })

  /** @type {import('esbuild').BuildOptions} */
  const optionsScripts = {
    absWorkingDir: racine,
    entryPoints: entrees,
    outdir: SORTIE_SCRIPTS,
    bundle: true,
    minify: true,
    format: 'iife',
    target: CIBLE_SCRIPTS,
    logLevel: 'warning',
  }
  /** @type {import('esbuild').BuildOptions} */
  const optionsStyle = {
    absWorkingDir: racine,
    stdin: {
      contents: feuilles.map((feuille) => `@import "${importRelatif(feuille)}";`).join('\n'),
      resolveDir: join(racine, DOSSIER_CSS),
      loader: 'css',
      sourcefile: 'assemblage-des-feuilles.css',
    },
    outfile: SORTIE_STYLE,
    bundle: true,
    minify: true,
    target: CIBLES_STYLE,
    external: RESSOURCES_EXTERNES,
    logLevel: 'warning',
  }

  if (surveiller) {
    const contextes = await Promise.all([context(optionsScripts), context(optionsStyle)])
    await Promise.all(contextes.map((contexteEsbuild) => contexteEsbuild.watch()))
    console.log('Ressources client surveillées (scripts et feuille de style).')
    return
  }
  await Promise.all([build(optionsScripts), build(optionsStyle)])
  console.log(
    `Ressources client construites : ${Object.keys(entrees).length} script(s) dans ${SORTIE_SCRIPTS}, ` +
      `${feuilles.length} feuille(s) assemblée(s) dans ${SORTIE_STYLE}.`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await construire({ surveiller: process.argv.includes('--surveiller') })
}
