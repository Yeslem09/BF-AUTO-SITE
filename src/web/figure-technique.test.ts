import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  departTraitDeRappel,
  FIGURE_FREIN_A_DISQUE,
  FIGURES_FAMILLES,
  legendeFigure,
  rendreFigureTechnique,
  type FigureTechnique,
} from './figure-technique.js'

const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url))

/**
 * Les dix-huit familles du catalogue, identifiées comme leurs dessins : les
 * douze de la direction V2, puis les six ajoutées le 2026-09-24.
 */
const FAMILLES = [
  'freinage',
  'batterie',
  'pneus',
  'vidange-et-filtres',
  'distribution',
  'embrayage',
  'amortisseurs-et-suspension',
  'echappement',
  'demarrage-et-charge',
  'climatisation',
  'eclairage',
  'essuie-glaces',
  'moteur-et-injection',
  'boite-de-vitesses',
  'diagnostic-electronique',
  'pare-brise-et-vitrage',
  'carrosserie',
  'peinture',
]

const TOUTES: readonly [string, FigureTechnique][] = [
  ['frein-a-disque', FIGURE_FREIN_A_DISQUE],
  ...Object.entries(FIGURES_FAMILLES),
]

describe('figure technique : légende', () => {
  it('nomme chaque repère dans l’ordre des numéros et signale les parties cachées', () => {
    expect(legendeFigure(FIGURE_FREIN_A_DISQUE)).toBe(
      'Frein à disque, vue de face : 1 disque, 2 étrier, 3 plaquettes (partie cachée, en tirets).',
    )
  })

  it('rend « Fig. N », relie le dessin à sa légende et reprend chaque numéro', () => {
    const rendu = rendreFigureTechnique(FIGURE_FREIN_A_DISQUE, {
      numero: 1,
      id: 'fig-a',
    }).toString()
    expect(rendu).toContain('<figure class="figure-technique" id="fig-a">')
    // Le dessin n'est pas annoncé : la légende, qui nomme la figure, le décrit déjà.
    expect(rendu).toContain('aria-hidden="true" focusable="false"')
    expect(rendu).not.toContain('role="img"')
    expect(rendu).toContain(
      '<figcaption class="figure-technique__legende" id="fig-a-legende"><span class="figure-technique__numero">Fig. 1</span> Frein à disque, vue de face : ',
    )
    expect(rendu).toContain('<use href="/img/figures/frein-a-disque.svg#dessin"/>')
    const chiffres = [
      ...rendu.matchAll(/<text class="figure-technique__chiffre"[^>]*>(\d+)<\/text>/g),
    ]
    expect(chiffres.map(([, n]) => n)).toEqual(['1', '2', '3'])
    const termes = [
      ...rendu.matchAll(/<span class="figure-technique__terme"><b>(\d+)<\/b> ([^<]+)<\/span>/g),
    ]
    expect(termes.map(([, n, libelle]) => `${n} ${libelle}`)).toEqual([
      '1 disque',
      '2 étrier',
      '3 plaquettes (partie cachée, en tirets)',
    ])
  })

  it('sans repères (vignette), garde le dessin et nomme encore les pièces', () => {
    const rendu = rendreFigureTechnique(FIGURES_FAMILLES['batterie'] as FigureTechnique, {
      numero: 2,
      id: 'fig-b',
      reperes: false,
    }).toString()
    expect(rendu).not.toContain('<text')
    expect(rendu).toContain('Fig. 2</span> Batterie : borne positive, borne négative, bac.')
  })

  it('échappe les libellés et n’écrit aucune couleur', () => {
    const figure: FigureTechnique = {
      ...FIGURE_FREIN_A_DISQUE,
      titre: 'Pièce <b>',
    }
    const rendu = rendreFigureTechnique(figure, { numero: 1, id: 'fig-c' }).toString()
    expect(rendu).toContain('Pièce &lt;b&gt;')
    expect(rendu).not.toMatch(/(?:fill|stroke|color)="#|style="/)
  })
})

describe('figure technique : trait de rappel', () => {
  it('part du bord de la pastille, dans la direction de la cible', () => {
    const depart = departTraitDeRappel(
      { numero: 1, libelle: 'x', pastille: { x: 0, y: 0 }, cible: { x: 30, y: 40 } },
      10,
    )
    expect(depart).toEqual({ x: 6, y: 8 })
  })

  it('ne divise jamais par zéro quand la cible est sous la pastille', () => {
    const point = { x: 5, y: 5 }
    expect(
      departTraitDeRappel({ numero: 1, libelle: 'x', pastille: point, cible: point }, 10),
    ).toEqual(point)
  })
})

describe('figure technique : données', () => {
  it('fournit une figure par famille du catalogue, chacune avec son dessin public', () => {
    expect(Object.keys(FIGURES_FAMILLES).sort()).toEqual([...FAMILLES].sort())
    for (const [famille, figure] of Object.entries(FIGURES_FAMILLES)) {
      expect(figure.dessin, famille).toBe(`/img/familles/${famille}.svg`)
    }
    for (const [, figure] of TOUTES) {
      expect(existsSync(`${PUBLIC}${figure.dessin}`), figure.dessin).toBe(true)
    }
  })

  it('numérote chaque figure de 1 à n, et garde pastilles et cibles dans le cadre', () => {
    for (const [nom, figure] of TOUTES) {
      const { cadre, rayonPastille } = figure
      expect(
        figure.reperes.map((r) => r.numero),
        nom,
      ).toEqual(figure.reperes.map((_, index) => index + 1))
      for (const { pastille, cible, libelle } of figure.reperes) {
        const message = `${nom}, ${libelle}`
        expect(pastille.x - rayonPastille, message).toBeGreaterThanOrEqual(cadre.x)
        expect(pastille.y - rayonPastille, message).toBeGreaterThanOrEqual(cadre.y)
        expect(pastille.x + rayonPastille, message).toBeLessThanOrEqual(cadre.x + cadre.largeur)
        expect(pastille.y + rayonPastille, message).toBeLessThanOrEqual(cadre.y + cadre.hauteur)
        expect(cible.x, message).toBeGreaterThanOrEqual(cadre.x)
        expect(cible.y, message).toBeGreaterThanOrEqual(cadre.y)
        expect(cible.x, message).toBeLessThanOrEqual(cadre.x + cadre.largeur)
        expect(cible.y, message).toBeLessThanOrEqual(cadre.y + cadre.hauteur)
      }
    }
  })

  it('ne pose jamais deux pastilles l’une sur l’autre', () => {
    for (const [nom, figure] of TOUTES) {
      const { reperes, rayonPastille } = figure
      for (const [i, a] of reperes.entries()) {
        for (const b of reperes.slice(i + 1)) {
          const distance = Math.hypot(a.pastille.x - b.pastille.x, a.pastille.y - b.pastille.y)
          expect(distance, `${nom} : ${a.libelle} et ${b.libelle}`).toBeGreaterThan(
            2 * rayonPastille,
          )
        }
      }
    }
  })
})
