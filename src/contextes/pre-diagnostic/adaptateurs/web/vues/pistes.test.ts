import { describe, expect, it } from 'vitest'
import { FIGURES_FAMILLES } from '../../../../../web/index.js'
import type { Piste } from '../../../domaine/arbre.js'
import { lireArbreDuSite } from '../../../essais/arbre-essai.js'
import { FAMILLES_EN_PHRASE, illustrerPistes, rendrePistes } from './pistes.js'

function piste(texte: string, famille: string | null): Piste {
  return { texte, verification: 'la pièce.', famille }
}

describe('pistes : une figure technique par famille concernée', () => {
  it('numérote les figures dans l’ordre des pistes et renvoie à celle déjà montrée', () => {
    const illustrees = illustrerPistes([
      piste('Un pneu usé.', 'pneus'),
      piste('Un parallélisme déréglé.', 'pneus'),
      piste('Un frein qui serre.', 'freinage'),
      piste('Une cause à situer.', null),
    ])
    expect(illustrees.map((p) => [p.figure?.numero ?? null, p.renvoi])).toEqual([
      [1, null],
      [null, 1],
      [2, null],
      [null, null],
    ])
  })

  it('une famille sans figure connue n’affiche rien, sans casser la numérotation', () => {
    const illustrees = illustrerPistes([
      piste('Une bosse.', 'famille-inconnue'),
      piste('Un disque voilé.', 'freinage'),
    ])
    expect(illustrees.map((p) => [p.figure?.numero ?? null, p.renvoi])).toEqual([
      [null, null],
      [1, null],
    ])
  })

  it('rend la figure légendée « Fig. N » à côté de la phrase, et le renvoi en toutes lettres', () => {
    const rendu = String(
      rendrePistes(
        [piste('Des plaquettes usées.', 'freinage'), piste('Un disque abîmé.', 'freinage')],
        'code-essai',
      ),
    )
    expect(rendu.match(/<figure class="figure-technique"/g)).toHaveLength(1)
    expect(rendu).toContain('id="pre-diagnostic-figure-1"')
    expect(rendu).toContain('<span class="figure-technique__numero">Fig. 1</span> Frein à disque')
    expect(rendu).toContain('Pièces concernées : voir Fig. 1.')
    expect(rendu).toContain('<ul class="pre-diagnostic-pistes__liste">')
    expect(rendu).not.toContain('<ol')
  })

  it('une demande de prix par famille, sous la liste, nommée et avec son prix indicatif (J5)', () => {
    const rendu = String(
      rendrePistes(
        [
          piste('Des plaquettes usées.', 'freinage'),
          piste('Un disque abîmé.', 'freinage'),
          piste('Une cause à situer.', null),
        ],
        'bruit.aucun.freinage.sifflement',
        new Map([
          [
            'freinage',
            { identifiant: 'freinage', libelle: 'Freinage', prixIndicatif: 'dès 89,00 € TTC' },
          ],
        ]),
      ),
    )
    const liste = rendu.slice(0, rendu.indexOf('<ul class="pre-diagnostic-prix">'))
    expect(liste).not.toContain('/demande')
    expect(rendu).toContain(
      '<li><a href="/demande?type=devis&amp;famille=freinage&amp;prediagnostic=bruit.aucun.freinage.sifflement">Demander un prix pour le freinage</a> <span class="pre-diagnostic-prix__indicatif">dès\u00a089,00\u00a0€\u00a0TTC</span></li>',
    )
    expect(rendu.match(/Demander un prix/g)).toHaveLength(1)
  })

  it('sans famille désignée, aucune demande de prix', () => {
    const rendu = String(rendrePistes([piste('Une cause à situer.', null)], 'code'))
    expect(rendu).not.toContain('pre-diagnostic-prix')
  })

  it('chaque famille citée par l’arbre du site a son nom en phrase, article compris', () => {
    const familles = new Set(
      lireArbreDuSite().resultats.flatMap((resultat) =>
        resultat.pistes.flatMap((p) => (p.famille === undefined ? [] : [p.famille])),
      ),
    )
    expect(familles.size).toBeGreaterThan(0)
    for (const famille of familles) expect(FAMILLES_EN_PHRASE[famille], famille).toBeDefined()
  })

  it('chaque famille citée par l’arbre du site a sa figure dans la couche web', () => {
    const familles = new Set(
      lireArbreDuSite().resultats.flatMap((resultat) =>
        resultat.pistes.flatMap((p) => (p.famille === undefined ? [] : [p.famille])),
      ),
    )
    expect(familles.size).toBeGreaterThan(0)
    const sansFigure = [...familles].filter((famille) => FIGURES_FAMILLES[famille] === undefined)
    expect(sansFigure).toEqual([])
  })
})
