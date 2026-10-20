/**
 * Portes sur les feuilles de style et les dessins :
 * - aucune couleur en dur hors de public/css/jetons.css (feuilles du socle et
 *   des contextes, SVG publics, gabarits de src/web) : la palette se change
 *   dans un seul fichier ;
 * - aucune propriété personnalisée employée sans être définie (un contexte
 *   écrit contre d'anciens jetons échoue ici, au lieu de perdre sa couleur en
 *   silence) ;
 * - budget de poids de la feuille assemblée (P-02).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { transform } from 'esbuild'
import { describe, expect, it } from 'vitest'
import { FEUILLES_COMMUNES, listerFeuillesDeStyle } from '../../scripts/construire-client.mjs'
import { sansCommentaires } from './jetons.js'

const RACINE = fileURLToPath(new URL('../..', import.meta.url))
const FEUILLE_JETONS = 'public/css/jetons.css'
const lire = (chemin: string): string => readFileSync(join(RACINE, chemin), 'utf8')

/** Feuilles assemblées dans /css/bf-auto.css : socle, puis contextes. */
const FEUILLES: readonly string[] = listerFeuillesDeStyle(RACINE)

const COULEUR_LITTERALE =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|:\s*(?:white|black|red|green|blue|gray|grey|silver|navy|teal|gold|beige|ivory|orange|yellow)\b/gi

function couleursEnDur(chemin: string, texte: string): string[] {
  return [...texte.matchAll(COULEUR_LITTERALE)].map(([motif]) => `${chemin} : « ${motif} »`)
}

function fichiers(dossier: string, extension: string): string[] {
  return readdirSync(join(RACINE, dossier), { recursive: true, encoding: 'utf8' })
    .filter((nom) => nom.endsWith(extension))
    .map((nom) => relative(RACINE, join(RACINE, dossier, nom)))
}

describe('couleurs : un seul fichier', () => {
  it('assemble le socle dans l’ordre des couches, jetons en premier', () => {
    expect(FEUILLES.slice(0, FEUILLES_COMMUNES.length)).toEqual(FEUILLES_COMMUNES)
    expect(FEUILLES[0]).toBe(FEUILLE_JETONS)
  })

  it('aucune feuille, hors jetons.css, n’écrit de couleur', () => {
    const fautes = FEUILLES.filter((feuille) => feuille !== FEUILLE_JETONS).flatMap((feuille) =>
      couleursEnDur(feuille, sansCommentaires(lire(feuille))),
    )
    expect(fautes).toEqual([])
  })

  it('les dessins publics (familles, figures) sont tracés en currentColor, sans couleur ni texte', () => {
    const dessins = [
      ...fichiers('public/img/familles', '.svg'),
      ...fichiers('public/img/figures', '.svg'),
    ]
    expect(dessins.length).toBeGreaterThanOrEqual(13)
    for (const dessin of dessins) {
      const svg = lire(dessin)
      expect(couleursEnDur(dessin, svg), dessin).toEqual([])
      expect(svg, dessin).toContain('<g id="dessin" fill="none" stroke="currentColor"')
      expect(svg, dessin).not.toMatch(/<text[\s>]|\scolor=/)
    }
  })

  it('les gabarits de la couche web n’écrivent aucune couleur dans leur HTML ni leurs SVG', () => {
    const gabarits = fichiers('src/web', '.ts').filter((f) => !f.endsWith('.test.ts'))
    const fautes = gabarits.flatMap((gabarit) =>
      [...lire(gabarit).matchAll(/(?:fill|stroke|color|stop-color)="#|\bstyle="/g)].map(
        ([motif]) => `${gabarit} : « ${motif} »`,
      ),
    )
    expect(fautes).toEqual([])
  })
})

describe('propriétés personnalisées', () => {
  it('toute propriété employée est définie quelque part dans la feuille assemblée', () => {
    const textes = FEUILLES.map((feuille) => sansCommentaires(lire(feuille)))
    const definies = new Set(
      textes.flatMap((texte) => [...texte.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map(([, nom]) => nom)),
    )
    const manquantes = FEUILLES.flatMap((feuille, index) =>
      [...(textes[index] ?? '').matchAll(/var\(\s*(--[a-z0-9-]+)/gi)]
        .map(([, nom]) => nom ?? '')
        .filter((nom) => !definies.has(nom))
        .map((nom) => `${feuille} : ${nom}`),
    )
    expect([...new Set(manquantes)]).toEqual([])
  })
})

/** Commandes touchables du socle : chacune dit « appuyé » à sa manière, sans reflet du navigateur. */
const COMMANDES_TOUCHABLES = [
  '.bouton--principal',
  '.bouton--secondaire',
  '.bouton-choix',
  '.choix-tuile',
  '.puce-famille',
  '.carte-famille',
  '.volet__titre',
  '.bouton-appel',
  '.menu__bouton',
  '.menu__lien',
  '.navigation__lien',
  '.barre-fixe__action',
  '.barre-fixe__action--principale',
] as const

describe('toucher : ni reflet bleu, ni appui muet', () => {
  const socle = FEUILLES_COMMUNES.map((feuille) => sansCommentaires(lire(feuille))).join('\n')

  it('neutralise le reflet de toucher de Chrome Android pour toute la page', () => {
    expect(socle).toMatch(/(?:^|[\s}])html\s*\{[^}]*-webkit-tap-highlight-color\s*:\s*transparent/)
  })

  it('donne à chaque commande touchable un état d’appui propre à la charte', () => {
    const sansAppui = COMMANDES_TOUCHABLES.filter(
      (classe) => !new RegExp(`${classe.replaceAll('.', '\\.')}:active(?![\\w-])`).test(socle),
    )
    expect(sansAppui).toEqual([])
    expect(socle).toMatch(/(?:^|[\s,}])a:active\s*[,{]/)
  })
})

/** P-02 : CSS de 15 Ko au plus, transférés compressés. */
const BUDGET_CSS_COMPRESSE = 15_000

describe('budget de la feuille assemblée (P-02)', () => {
  it('tient dans 15 Ko compressés, socle et contextes compris', async () => {
    const assemblee = FEUILLES.map(lire).join('\n')
    const { code } = await transform(assemblee, { loader: 'css', minify: true })
    const compresse = gzipSync(code).length
    console.info(
      `Feuille assemblée : ${code.length} octets minifiés, ${compresse} octets compressés (gzip).`,
    )
    expect(compresse).toBeLessThanOrEqual(BUDGET_CSS_COMPRESSE)
  })
})
