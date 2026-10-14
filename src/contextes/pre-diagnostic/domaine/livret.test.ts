import { describe, expect, it } from 'vitest'
import {
  arbreAccepte,
  creerArbreEssai,
  lireArbreDuSite,
  relire,
  resultatBrut,
} from '../essais/arbre-essai.js'
import { lireArbre } from './lecture-arbre.js'
import { composerLivret } from './livret.js'

describe('livret de relecture', () => {
  it('compte une entrée par branche, dans l’ordre de la première question', () => {
    const site = arbreAccepte(lireArbreDuSite())
    const livret = composerLivret(site)
    expect(livret.branches.map((entree) => entree.branche.code)).toEqual(
      site.branches.map((branche) => branche.code),
    )
  })

  it('reprend chaque résultat atteint, avec toutes les suites de réponses qui y mènent', () => {
    const livret = composerLivret(arbreAccepte())
    const bruit = livret.branches.find((entree) => entree.branche.code === 'bruit')
    const aSituer = bruit?.resultats.find((entree) => entree.resultat.code === 'bruit-a-situer')
    expect(aSituer?.chemins).toEqual([
      [
        { question: 'Quand entendez-vous ce bruit ?', reponse: 'Quand je freine' },
        { question: 'À quoi ressemble ce bruit ?', reponse: 'Je ne sais pas' },
      ],
      [{ question: 'Quand entendez-vous ce bruit ?', reponse: 'Je ne sais pas' }],
    ])
    expect(bruit?.questions.map((question) => question.code)).toEqual([
      'bruit-moment',
      'frein-bruit',
    ])
  })

  it('affiche le niveau vu par le conducteur, plancher de la branche compris', () => {
    // Un arbre que la porte refuserait (« Pas d'urgence » sous le plancher de
    // Bruit) : le livret dit quand même ce que le moteur afficherait, jamais moins.
    const brut = creerArbreEssai()
    resultatBrut(brut, 'bruit-roulement').niveau = 'sans-urgence'
    const lecture = lireArbre(brut)
    if (!lecture.lisible) throw new Error(lecture.problemes.join('\n'))
    const livret = composerLivret(lecture.arbre)
    const bruit = livret.branches.find((entree) => entree.branche.code === 'bruit')
    const roulement = bruit?.resultats.find((entree) => entree.resultat.code === 'bruit-roulement')
    expect(roulement?.niveau).toBe('a-controler')
    const voyant = livret.branches.find((entree) => entree.branche.code === 'voyant')
    const entretien = voyant?.resultats.find(
      (entree) => entree.resultat.code === 'voyant-entretien',
    )
    expect(entretien?.niveau).toBe('sans-urgence')
  })

  it('signale les branches refusées à une relecture précédente', () => {
    const livret = composerLivret(
      arbreAccepte({ ...relire(creerArbreEssai()), branches_non_validees: ['vibrations'] }),
    )
    expect(
      livret.branches.filter((entree) => entree.elaguee).map((entree) => entree.branche.code),
    ).toEqual(['vibrations'])
  })
})
