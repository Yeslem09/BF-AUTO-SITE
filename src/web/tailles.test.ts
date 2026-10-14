/**
 * Porte des tailles de texte (public âgé, jury de la passe 1) :
 * - texte courant à 18 px au bureau (dès 1024 px), 16 px au moins partout ;
 * - rien d'utile sous 16 px : statut, horaires, aides, sous-titres ;
 * - capitales espacées (surtitres) à 14 px au moins, et `--taille-mini`
 *   réservée à elles.
 * Le rendu réel est mesuré par tests/e2e/design.spec.ts.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { listerFeuillesDeStyle } from '../../scripts/construire-client.mjs'
import { premieresDeclarations, sansCommentaires } from './jetons.js'

const RACINE = new URL('../..', import.meta.url).pathname
const lire = (chemin: string): string => readFileSync(join(RACINE, chemin), 'utf8')
const JETONS = premieresDeclarations(lire('public/css/jetons.css'))

const PX_PAR_REM = 16
const LARGEURS = [320, 360, 390, 768, 1024, 1280, 1440, 1920] as const
const BUREAU = 1024
const TEXTE_BUREAU = 18
const MINIMUM_UTILE = 16
const MINIMUM_CAPITALES = 14
/** Arrondi du navigateur : 17,98 px s'affiche en 18 px. */
const TOLERANCE = 0.05

/** Un terme : `1rem`, `14px`, `0.35vw`. */
function evaluerTerme(terme: string, largeur: number): number {
  const lu = /^(\d*\.?\d+)(rem|px|vw)$/.exec(terme.trim())
  if (lu === null) throw new Error(`Terme de taille illisible : « ${terme} »`)
  const nombre = Number(lu[1])
  if (lu[2] === 'rem') return nombre * PX_PAR_REM
  if (lu[2] === 'vw') return (nombre * largeur) / 100
  return nombre
}

/** Valeur d'un jeton de taille, en pixels, à une largeur de fenêtre donnée. */
function evaluerTaille(valeur: string, largeur: number): number {
  const pince = /^clamp\((.+),(.+),(.+)\)$/.exec(valeur.trim())
  const somme = (texte: string): number =>
    texte.split('+').reduce((total, terme) => total + evaluerTerme(terme, largeur), 0)
  if (pince === null) return somme(valeur)
  const [minimum, prefere, maximum] = [pince[1], pince[2], pince[3]].map((partie) =>
    somme(partie ?? ''),
  )
  return Math.min(Math.max(prefere ?? 0, minimum ?? 0), maximum ?? Infinity)
}

function taille(jeton: string, largeur: number): number {
  const valeur = JETONS.get(jeton)
  if (valeur === undefined) throw new Error(`Jeton ${jeton} absent de jetons.css`)
  return evaluerTaille(valeur, largeur)
}

const JETONS_DE_TAILLE = [...JETONS.keys()].filter((nom) => nom.startsWith('--taille-'))

describe('tailles de texte : public âgé', () => {
  it('lit les jetons de taille, pinces comprises', () => {
    expect(evaluerTaille('clamp(1rem, 0.9rem + 0.35vw, 1.125rem)', 320)).toBe(16)
    expect(evaluerTaille('clamp(1rem, 0.9rem + 0.35vw, 1.125rem)', 1920)).toBe(18)
    expect(evaluerTaille('0.875rem', 1440)).toBe(14)
    expect(JETONS_DE_TAILLE.length).toBeGreaterThanOrEqual(8)
  })

  it('texte courant : 18 px au bureau, 16 px au moins sur téléphone', () => {
    for (const largeur of LARGEURS) {
      expect(taille('--taille-base', largeur), `${largeur} px`).toBeGreaterThanOrEqual(
        MINIMUM_UTILE,
      )
      if (largeur >= BUREAU) {
        expect(taille('--taille-base', largeur), `${largeur} px`).toBeGreaterThanOrEqual(
          TEXTE_BUREAU - TOLERANCE,
        )
      }
    }
  })

  it('rien d’utile sous 16 px : chaque taille, sauf celle des capitales', () => {
    const fautes = JETONS_DE_TAILLE.filter((nom) => nom !== '--taille-mini').flatMap((nom) =>
      LARGEURS.filter((largeur) => taille(nom, largeur) < MINIMUM_UTILE).map(
        (largeur) => `${nom} à ${largeur} px : ${taille(nom, largeur).toFixed(1)} px`,
      ),
    )
    expect(fautes).toEqual([])
  })

  it('capitales espacées : 14 px au moins', () => {
    for (const largeur of LARGEURS) {
      expect(taille('--taille-mini', largeur)).toBeGreaterThanOrEqual(MINIMUM_CAPITALES)
    }
  })

  it('la plus petite taille ne sert qu’aux capitales (surtitres, titres du pied)', () => {
    const fautes = listerFeuillesDeStyle(RACINE).flatMap((feuille) =>
      [...sansCommentaires(lire(feuille)).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, , corps = '']) => /font-size\s*:\s*var\(--taille-mini\)/.test(corps))
        .filter(([, , corps = '']) => !/text-transform\s*:\s*uppercase/.test(corps))
        .map(([, selecteur = '']) => `${feuille} : ${selecteur.trim()}`),
    )
    expect(fautes).toEqual([])
  })
})
