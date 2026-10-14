/**
 * Porte de contraste (C-B1, P-04) : chaque paire de rôles réellement employée
 * par les composants est mesurée selon WCAG 2.2, dans les zones claires et dans
 * chaque zone sombre. Changer la palette dans jetons.css rejoue cette porte.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  lireBlocs,
  rapportContraste,
  resoudreCouleur,
  superposer,
  type Declarations,
} from './jetons.js'

const JETONS = readFileSync(new URL('../../public/css/jetons.css', import.meta.url), 'utf8')
const BLOCS = lireBlocs(JETONS)

/** Premier bloc dont le sélecteur commence par `debut` (sélecteurs listés joints par « , »). */
function bloc(debut: string): Declarations {
  const trouve = BLOCS.find(({ selecteur }) => selecteur.startsWith(debut))
  if (trouve === undefined) throw new Error(`Bloc « ${debut} » introuvable dans jetons.css`)
  return trouve.declarations
}

const RACINE = bloc(':root')
const CLAIR = superposer(RACINE, bloc(':root, .zone-claire'))
const SOMBRE = superposer(CLAIR, bloc('.zone-sombre'))

/**
 * Texte courant : AAA. Autre texte (liens compris : orange foncé choisi par
 * Anthony) : AA. Grand texte (18,66 px en demi-gras au moins), composants,
 * bordures de champ, focus : 3:1.
 */
const AAA = 7
const AA = 4.5
const GRAPHIQUE = 3
const GRAND_TEXTE = 3

type Paire = readonly [avantPlan: string, fond: string, minimum: number]

function verifier(theme: Declarations, paires: readonly Paire[]): string[] {
  return paires.flatMap(([avantPlan, fond, minimum]) => {
    const rapport = rapportContraste(
      resoudreCouleur(theme, avantPlan),
      resoudreCouleur(theme, fond),
    )
    return rapport >= minimum
      ? []
      : [`${avantPlan} sur ${fond} : ${rapport.toFixed(2)} (minimum ${minimum})`]
  })
}

const FONDS_CLAIRS = ['--fond-page', '--fond-surface', '--fond-plaque', '--fond-panneau']

const PAIRES_CLAIRES: readonly Paire[] = [
  ...FONDS_CLAIRS.flatMap((fond): Paire[] => [
    ['--texte', fond, AAA],
    ['--texte-doux', fond, AAA],
    ['--texte-titre', fond, AAA],
    ['--lien', fond, AA],
    ['--texte-repere', fond, AA],
    ['--accent-texte', fond, AA],
    ['--accent-grand-texte', fond, GRAND_TEXTE],
    ['--erreur', fond, AA],
    ['--succes', fond, AA],
    ['--alerte-danger', fond, AA],
    ['--focus', fond, GRAPHIQUE],
    ['--choix-bord', fond, GRAPHIQUE],
    ['--pastille-ouvert', fond, GRAPHIQUE],
    ['--pastille-ferme', fond, GRAPHIQUE],
    ['--pastille-a-confirmer', fond, GRAPHIQUE],
  ]),
  ['--texte', '--fond-sourd', AAA],
  ['--texte-titre', '--fond-sourd', AAA],
  ['--texte-doux', '--fond-sourd', AA],
  ['--lien', '--fond-sourd', AA],
  ['--texte-titre', '--fond-survol', AAA],
  ['--texte-doux', '--fond-survol', AA],
  ['--choix-bord', '--fond-survol', GRAPHIQUE],
  ['--bouton-texte', '--bouton-fond', AA],
  ['--bouton-texte', '--bouton-fond-survol', AA],
  ['--bouton-texte', '--bouton-fond-appui', AA],
  ['--bouton-bord', '--fond-page', GRAPHIQUE],
  ['--champ-texte', '--champ-fond', AAA],
  ['--champ-indication', '--champ-fond', AA],
  ['--bordure-champ', '--champ-fond', GRAPHIQUE],
  ['--bordure-champ', '--fond-page', GRAPHIQUE],
  ['--texte', '--erreur-fond', AAA],
  ['--erreur', '--erreur-fond', AA],
  ['--alerte-danger-texte', '--alerte-danger', AA],
  ['--texte', '--alerte-attention-fond', AAA],
  ['--alerte-neutre', '--fond-surface', GRAPHIQUE],
  ['--texte', '--succes-fond', AAA],
  ['--texte', '--surlignage', AAA],
  ['--encre-figure', '--fond-figure', AAA],
  ['--accent', '--fond-figure', GRAPHIQUE],
  ['--accent', '--fond-sourd', GRAPHIQUE],
]

/** Chaque zone sombre, sur son propre fond (déclaré à l'étage 3 des jetons). */
const FONDS_SOMBRES = [
  '--fond-entete',
  '--fond-ouverture',
  '--fond-bandeau',
  '--fond-pied',
  '--fond-barre-fixe',
  '--fond-menu',
]

const PAIRES_SOMBRES: readonly Paire[] = [
  ...FONDS_SOMBRES.flatMap((fond): Paire[] => [
    ['--texte', fond, AAA],
    ['--texte-doux', fond, AAA],
    ['--texte-titre', fond, AAA],
    ['--lien', fond, AAA],
    ['--texte-repere', fond, AA],
    ['--accent-texte', fond, AA],
    ['--accent-grand-texte', fond, GRAND_TEXTE],
    ['--erreur', fond, AA],
    ['--focus', fond, GRAPHIQUE],
    ['--choix-bord', fond, GRAPHIQUE],
    ['--bouton-bord', fond, GRAPHIQUE],
    ['--bordure-champ', fond, GRAPHIQUE],
    ['--bouton-fond', fond, GRAPHIQUE],
    ['--pastille-ouvert', fond, GRAPHIQUE],
    ['--pastille-ferme', fond, GRAPHIQUE],
    ['--pastille-a-confirmer', fond, GRAPHIQUE],
  ]),
  ['--bouton-texte', '--bouton-fond', AA],
  ['--bouton-texte', '--bouton-fond-survol', AA],
  ['--bouton-texte', '--bouton-fond-appui', AA],
  ['--bouton-bord-survol', '--fond-barre-fixe', GRAPHIQUE],
  ['--texte', '--fond-survol', AAA],
  ['--texte-titre', '--fond-survol', AAA],
]

describe('contrastes des jetons (WCAG 2.2)', () => {
  it('zones claires : texte courant AAA, tout texte AA, composants et focus 3:1', () => {
    expect(verifier(CLAIR, PAIRES_CLAIRES)).toEqual([])
  })

  it('zones sombres : mêmes seuils, sur le fond de chaque zone', () => {
    expect(verifier(SOMBRE, PAIRES_SOMBRES)).toEqual([])
  })

  it('le bouton principal est orange atelier partout, sur clair comme sur graphite (C-P2)', () => {
    const orange = resoudreCouleur(RACINE, '--couleur-orange')
    expect(resoudreCouleur(CLAIR, '--bouton-fond')).toBe(orange)
    expect(resoudreCouleur(SOMBRE, '--bouton-fond')).toBe(orange)
  })

  it('les alertes du pré-diagnostic n’emploient jamais l’orange de marque', () => {
    const orange = resoudreCouleur(RACINE, '--couleur-orange')
    for (const alerte of ['--alerte-danger', '--alerte-attention', '--alerte-neutre']) {
      expect(resoudreCouleur(CLAIR, alerte), alerte).not.toBe(orange)
    }
  })

  it('le calcul suit la définition WCAG', () => {
    expect(rapportContraste('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(rapportContraste('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(rapportContraste('#1c1b19', '#e4682b')).toBeCloseTo(5.17, 2)
  })
})
